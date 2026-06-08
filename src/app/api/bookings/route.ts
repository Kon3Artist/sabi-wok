import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { calcPlatformFee, calcWorkerPayout } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  workerId: z.string(),
  skillId: z.string().optional(),
  description: z.string().min(10),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  address: z.string().min(3),
  totalAmount: z.number().positive(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).id;
  const body = await req.json();
  const data = schema.parse(body);

  const worker = await prisma.workerProfile.findUnique({
    where: { userId: data.workerId },
    include: { user: true },
  });
  if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

  const platformFee = calcPlatformFee(data.totalAmount);
  const workerPayout = calcWorkerPayout(data.totalAmount);

  const booking = await prisma.booking.create({
    data: {
      clientId,
      workerId: worker.id,
      skillId: data.skillId,
      description: data.description,
      scheduledStart: new Date(data.scheduledStart),
      scheduledEnd: new Date(data.scheduledEnd),
      address: data.address,
      agreedRate: worker.hourlyRate ?? 0,
      totalAmount: data.totalAmount,
      platformFee,
      workerPayout,
      status: "PENDING",
    },
  });

  const client = await prisma.user.findUnique({ where: { id: clientId } });
  const reference = generateReference("BOOK");

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: data.totalAmount,
      status: "PENDING",
      paystackReference: reference,
    },
  });

  const paystackRes = await initializeTransaction({
    email: client!.email,
    amount: Math.round(data.totalAmount * 100),
    reference,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify?reference=${reference}`,
    metadata: { bookingId: booking.id, workerId: worker.userId, clientId },
  });

  return NextResponse.json({
    booking,
    paymentUrl: paystackRes.data?.authorization_url,
    reference,
  }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || user.role;

  const bookings = await prisma.booking.findMany({
    where: role === "WORKER"
      ? { worker: { userId: user.id } }
      : { clientId: user.id },
    include: {
      client: true,
      worker: { include: { user: true } },
      payment: true,
      review: true,
      dispute: true,
    },
    orderBy: { scheduledStart: "desc" },
  });

  return NextResponse.json(bookings);
}
