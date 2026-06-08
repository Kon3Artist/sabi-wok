import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { z } from "zod";

const schema = z.object({
  jobRequestId: z.string(),
  amount: z.number().positive(),
  breakdown: z.string().optional(),
  estimatedHours: z.number().optional(),
  message: z.string().optional(),
  expiresInDays: z.number().default(3),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "WORKER") return NextResponse.json({ error: "Workers only" }, { status: 403 });

  const body = schema.parse(await req.json());

  const workerProfile = await prisma.workerProfile.findUnique({ where: { userId: user.id } });
  if (!workerProfile) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  const jobRequest = await prisma.jobRequest.findUnique({
    where: { id: body.jobRequestId },
    include: { client: true },
  });
  if (!jobRequest) return NextResponse.json({ error: "Job request not found" }, { status: 404 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + body.expiresInDays);

  const quote = await prisma.quote.create({
    data: {
      jobRequestId: body.jobRequestId,
      workerProfileId: workerProfile.id,
      amount: body.amount,
      breakdown: body.breakdown,
      estimatedHours: body.estimatedHours,
      message: body.message,
      status: "SENT",
      expiresAt,
    },
  });

  await prisma.jobRequest.update({
    where: { id: body.jobRequestId },
    data: { status: "QUOTED" },
  });

  // Notify client
  await prisma.notification.create({
    data: {
      userId: jobRequest.clientId,
      title: "You have a quote!",
      body: `A worker sent you a quote for "${jobRequest.title}"`,
      type: "quote",
      link: "/dashboard/client",
    },
  });

  await pusherServer.trigger(
    CHANNELS.client(jobRequest.clientId),
    EVENTS.BOOKING_REQUEST,
    { quoteId: quote.id, jobRequestId: body.jobRequestId }
  );

  return NextResponse.json(quote, { status: 201 });
}
