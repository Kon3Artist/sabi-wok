import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string(),
  reason: z.string().min(20),
  evidence: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = schema.parse(await req.json());

  const booking = await prisma.booking.findUnique({ where: { id: body.bookingId }, include: { dispute: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.dispute) return NextResponse.json({ error: "Dispute already raised" }, { status: 400 });
  if (booking.clientId !== userId && booking.workerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dispute = await prisma.dispute.create({
    data: { bookingId: body.bookingId, raisedBy: userId, reason: body.reason, evidence: body.evidence },
  });

  await prisma.booking.update({ where: { id: body.bookingId }, data: { status: "DISPUTED" } });
  if (booking.payment) {
    await prisma.payment.updateMany({ where: { bookingId: body.bookingId }, data: { status: "PENDING" } });
  }

  await prisma.notification.createMany({
    data: [
      { userId: "ADMIN", title: "New Dispute", body: `Dispute raised on booking ${body.bookingId}`, type: "dispute", link: `/admin/disputes/${dispute.id}` },
    ],
  });

  return NextResponse.json(dispute, { status: 201 });
}
