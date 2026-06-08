import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { z } from "zod";

const schema = z.object({
  workerProfileId: z.string(),
  skillId: z.string().optional(),
  title: z.string().min(5),
  description: z.string().min(20),
  address: z.string().min(3),
  preferredDate: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = (session.user as any).id;
  const body = schema.parse(await req.json());

  const jobRequest = await prisma.jobRequest.create({
    data: {
      clientId,
      workerProfileId: body.workerProfileId,
      skillId: body.skillId,
      title: body.title,
      description: body.description,
      address: body.address,
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      photoUrls: body.photoUrls ?? [],
    },
    include: { client: true, worker: { include: { user: true } } },
  });

  // Notify the worker
  await prisma.notification.create({
    data: {
      userId: jobRequest.worker.userId,
      title: "New Job Request!",
      body: `${jobRequest.client.name} has requested a quote for: ${body.title}`,
      type: "job_request",
      link: "/dashboard/worker",
    },
  });

  await pusherServer.trigger(
    CHANNELS.worker(jobRequest.worker.userId),
    EVENTS.BOOKING_REQUEST,
    { jobRequestId: jobRequest.id, title: body.title }
  );

  return NextResponse.json(jobRequest, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || user.role;

  const requests = await prisma.jobRequest.findMany({
    where: role === "WORKER"
      ? { worker: { userId: user.id } }
      : { clientId: user.id },
    include: {
      client: true,
      worker: { include: { user: true } },
      quotes: true,
      booking: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
