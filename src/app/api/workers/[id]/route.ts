import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const worker = await prisma.workerProfile.findUnique({
    where: { userId: id },
    include: {
      user: true,
      skills: { include: { skill: { include: { category: true } } } },
      reviewsReceived: { include: { reviewer: true }, orderBy: { createdAt: "desc" } },
      portfolioImages: true,
    },
  });
  if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(worker);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.workerProfile.update({
    where: { userId: id },
    data: body,
  });
  return NextResponse.json(updated);
}
