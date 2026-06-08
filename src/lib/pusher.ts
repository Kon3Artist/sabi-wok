import Pusher from "pusher";
import PusherClient from "pusher-js";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

export const CHANNELS = {
  worker: (id: string) => `worker-${id}`,
  client: (id: string) => `client-${id}`,
  booking: (id: string) => `booking-${id}`,
};

export const EVENTS = {
  BOOKING_REQUEST: "booking-request",
  BOOKING_ACCEPTED: "booking-accepted",
  BOOKING_CANCELLED: "booking-cancelled",
  JOB_STARTED: "job-started",
  JOB_COMPLETED: "job-completed",
  PAYMENT_RELEASED: "payment-released",
  NEW_NOTIFICATION: "new-notification",
};
