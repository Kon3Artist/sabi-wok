import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const worker = await prisma.workerProfile.update({
    where: { userId: params.userId },
    data: { isVerified: true },
  });

  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: "Profile Verified! ✓",
      body: "Congratulations! Your profile has been verified. You now have the Verified badge.",
      type: "account",
    },
  });

  return NextResponse.json(worker);
}
