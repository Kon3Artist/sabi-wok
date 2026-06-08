import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { initiateTransfer, generateReference } from "@/lib/paystack";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();
  const user = session.user as any;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { worker: { include: { user: true } }, client: true, payment: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "accept" && booking.worker.userId === user.id) {
    const updated = await prisma.booking.update({ where: { id }, data: { status: "ACCEPTED" } });
    await pusherServer.trigger(CHANNELS.client(booking.clientId), EVENTS.BOOKING_ACCEPTED, { bookingId: id });
    await prisma.notification.create({
      data: { userId: booking.clientId, title: "Booking Accepted", body: `${booking.worker.user.name} accepted your booking.`, type: "booking", link: `/dashboard/client` },
    });
    return NextResponse.json(updated);
  }

  if (action === "start" && booking.worker.userId === user.id) {
    const updated = await prisma.booking.update({ where: { id }, data: { status: "IN_PROGRESS", actualStart: new Date() } });
    await prisma.workerProfile.update({ where: { id: booking.workerId }, data: { availability: "ON_JOB" } });
    await pusherServer.trigger(CHANNELS.client(booking.clientId), EVENTS.JOB_STARTED, { bookingId: id });
    return NextResponse.json(updated);
  }

  if (action === "complete" && booking.clientId === user.id) {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "COMPLETED", actualEnd: new Date(), clientConfirmed: true },
    });

    if (booking.payment && booking.worker.paystackRecipientCode) {
      await prisma.payment.update({ where: { bookingId: id }, data: { status: "RELEASED", releasedAt: new Date() } });
      await initiateTransfer({
        amount: Math.round(Number(booking.workerPayout) * 100),
        recipientCode: booking.worker.paystackRecipientCode,
        reason: `Sabi Wok — Booking ${id}`,
        reference: generateReference("PAY"),
      });
    }

    await prisma.workerProfile.update({
      where: { id: booking.workerId },
      data: { availability: "AVAILABLE", totalJobsDone: { increment: 1 } },
    });

    await prisma.notification.create({
      data: { userId: booking.worker.userId, title: "Payment Released!", body: "Your payment has been released for a completed job.", type: "payment", link: `/dashboard/worker` },
    });
    await pusherServer.trigger(CHANNELS.worker(booking.worker.userId), EVENTS.PAYMENT_RELEASED, { bookingId: id });
    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    const isWorker = booking.worker.userId === user.id;
    const isClient = booking.clientId === user.id;
    if (!isWorker && !isClient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });
    if (booking.payment) {
      await prisma.payment.update({ where: { bookingId: id }, data: { status: "REFUNDED", refundedAt: new Date() } });
    }
    if (isWorker) {
      await prisma.workerProfile.update({ where: { id: booking.workerId }, data: { availability: "AVAILABLE" } });
    }
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
