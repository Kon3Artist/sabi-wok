import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/", req.url));

  const result = await verifyTransaction(reference);
  if (result.data?.status !== "success") {
    return NextResponse.redirect(new URL("/dashboard/client?payment=failed", req.url));
  }

  const payment = await prisma.payment.findUnique({ where: { paystackReference: reference } });
  if (!payment) return NextResponse.redirect(new URL("/dashboard/client", req.url));

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "ESCROWED", escrowedAt: new Date() },
  });

  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: "ACCEPTED" },
  });

  // Notify worker
  const booking = await prisma.booking.findUnique({
    where: { id: payment.bookingId },
    include: { worker: { include: { user: true } }, client: true },
  });

  if (booking) {
    await prisma.notification.create({
      data: {
        userId: booking.worker.userId,
        title: "New Booking Request!",
        body: `${booking.client.name} has booked you and payment is secured.`,
        type: "booking",
        link: "/dashboard/worker",
      },
    });
  }

  return NextResponse.redirect(new URL(`/dashboard/client?payment=success&booking=${payment.bookingId}`, req.url));
}
