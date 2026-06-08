import type {
  User, WorkerProfile, ClientProfile, Booking, Payment,
  Review, Dispute, Category, Skill, WorkerSkill, Notification,
  PortfolioImage, AvailabilitySlot,
} from "@prisma/client";

export type WorkerWithRelations = WorkerProfile & {
  user: User;
  skills: (WorkerSkill & { skill: Skill & { category: Category } })[];
  reviewsReceived: (Review & { reviewer: User })[];
  portfolioImages: PortfolioImage[];
};

export type BookingWithRelations = Booking & {
  client: User;
  worker: WorkerProfile & { user: User };
  payment: Payment | null;
  review: Review | null;
  dispute: Dispute | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: "CLIENT" | "WORKER" | "ADMIN";
};

export { User, WorkerProfile, Booking, Payment, Review, Dispute, Category, Skill, Notification };
