import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { calcPlatformFee, calcWorkerPayout } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  const clientId = (session.user as any).id;

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      jobRequest: { include: { client: true } },
      worker: { include: { user: true } },
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.jobRequest.clientId !== clientId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "accept") {
    const total = Number(quote.amount);
    const platformFee = calcPlatformFee(total);
    const workerPayout = calcWorkerPayout(total);

    // Create booking from accepted quote
    const booking = await prisma.booking.create({
      data: {
        clientId,
        workerId: quote.workerProfileId,
        description: quote.jobRequest.description,
        scheduledStart: quote.jobRequest.preferredDate ?? new Date(),
        scheduledEnd: new Date((quote.jobRequest.preferredDate ?? new Date()).getTime() + (quote.estimatedHours ?? 2) * 3600000),
        address: quote.jobRequest.address,
        agreedRate: quote.amount,
        totalAmount: total,
        platformFee,
        workerPayout,
        status: "PENDING",
        jobRequestId: quote.jobRequest.id,
        quoteId: quote.id,
      },
    });

    // Update statuses
    await prisma.quote.update({ where: { id: params.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    await prisma.jobRequest.update({ where: { id: quote.jobRequestId }, data: { status: "BOOKED" } });

    // Initialize payment
    const reference = generateReference("QUOTE");
    await prisma.payment.create({
      data: { bookingId: booking.id, amount: total, status: "PENDING", paystackReference: reference },
    });

    const paystackRes = await initializeTransaction({
      email: quote.jobRequest.client.email,
      amount: Math.round(total * 100),
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify?reference=${reference}`,
      metadata: { bookingId: booking.id, quoteId: quote.id },
    });

    await prisma.notification.create({
      data: {
        userId: quote.worker.userId,
        title: "Quote Accepted!",
        body: `${quote.jobRequest.client.name} accepted your quote. Payment is being processed.`,
        type: "quote",
        link: "/dashboard/worker",
      },
    });

    return NextResponse.json({ booking, paymentUrl: paystackRes.data?.authorization_url });
  }

  if (action === "reject") {
    await prisma.quote.update({ where: { id: params.id }, data: { status: "REJECTED", rejectedAt: new Date() } });
    await prisma.jobRequest.update({ where: { id: quote.jobRequestId }, data: { status: "OPEN" } });

    await prisma.notification.create({
      data: {
        userId: quote.worker.userId,
        title: "Quote Declined",
        body: `Your quote for "${quote.jobRequest.title}" was declined.`,
        type: "quote",
        link: "/dashboard/worker",
      },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
