import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviewerId = (session.user as any).id;
  const body = schema.parse(await req.json());

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: { review: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.clientId !== reviewerId) return NextResponse.json({ error: "Only clients can review" }, { status: 403 });
  if (booking.status !== "COMPLETED") return NextResponse.json({ error: "Job must be completed first" }, { status: 400 });
  if (booking.review) return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

  const review = await prisma.review.create({
    data: {
      bookingId: body.bookingId,
      reviewerId,
      workerProfileId: booking.workerId,
      rating: body.rating,
      comment: body.comment,
    },
  });

  // Recalculate average rating
  const agg = await prisma.review.aggregate({
    where: { workerProfileId: booking.workerId },
    _avg: { rating: true },
  });
  await prisma.workerProfile.update({
    where: { id: booking.workerId },
    data: { avgRating: agg._avg.rating ?? 0 },
  });

  return NextResponse.json(review, { status: 201 });
}
