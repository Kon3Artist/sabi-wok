import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET!).update(body).digest("hex");

  if (hash !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const ref = event.data.reference;
    await prisma.payment.updateMany({
      where: { paystackReference: ref },
      data: { status: "ESCROWED", escrowedAt: new Date() },
    });
  }

  if (event.event === "transfer.success") {
    const ref = event.data.reference;
    await prisma.payment.updateMany({
      where: { paystackReference: ref },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
  }

  return NextResponse.json({ received: true });
}
