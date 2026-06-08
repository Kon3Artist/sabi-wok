import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const workerSchema = z.object({
  bio: z.string().max(1000).optional(),
  location: z.string().optional(),
  serviceRadius: z.number().optional(),
  pricingMode: z.enum(["HOURLY", "QUOTE"]).optional(),
  hourlyRate: z.number().positive().optional(),
  bankCode: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankAccountName: z.string().optional(),
  skillIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();
  const data = workerSchema.parse(body);

  if (user.role === "WORKER") {
    const { skillIds, ...profileData } = data;

    const updated = await prisma.workerProfile.update({
      where: { userId: user.id },
      data: profileData,
    });

    if (skillIds) {
      await prisma.workerSkill.deleteMany({ where: { workerProfile: { userId: user.id } } });
      const profile = await prisma.workerProfile.findUnique({ where: { userId: user.id } });
      await prisma.workerSkill.createMany({
        data: skillIds.map((skillId) => ({ workerProfileId: profile!.id, skillId })),
      });
    }

    return NextResponse.json(updated);
  }

  const { name, phone } = body;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, phone },
  });

  return NextResponse.json(updated);
}
