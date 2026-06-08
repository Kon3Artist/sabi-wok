import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkerCard } from "@/components/workers/worker-card";
import { Button } from "@/components/ui/button";
import { Search, Shield, Clock, Star, ArrowRight } from "lucide-react";
import type { WorkerWithRelations } from "@/types";

async function getFeaturedWorkers(): Promise<WorkerWithRelations[]> {
  const workers = await prisma.workerProfile.findMany({
    where: { registrationPaid: true },
    orderBy: [{ featuredUntil: "desc" }, { avgRating: "desc" }, { totalJobsDone: "desc" }],
    take: 8,
    include: {
      user: true,
      skills: { include: { skill: { include: { category: true } } } },
      reviewsReceived: { include: { reviewer: true }, take: 3 },
      portfolioImages: { take: 3 },
    },
  });
  return workers as unknown as WorkerWithRelations[];
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function HomePage() {
  const [workers, categories] = await Promise.all([getFeaturedWorkers(), getCategories()]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Find Trusted Skilled Workers<br />
            <span className="text-brand-200">Across Sierra Leone</span>
          </h1>
          <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
            Book verified electricians, plumbers, cleaners, tailors, and more — with secure payments and real-time scheduling.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for a service..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <Link href="/workers">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                Browse Workers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/workers?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 hover:border-brand-400 hover:shadow-sm transition-all group"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust pillars */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, title: "Secure Escrow Payments", desc: "Your money is held safely until the job is done. Release payment only when you're satisfied." },
              { icon: Star, title: "Verified Professionals", desc: "Every worker undergoes ID verification. Check reviews from real clients before booking." },
              { icon: Clock, title: "Real-Time Scheduling", desc: "See live availability, book instantly, and get reminders. Workers manage their calendars in-app." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured workers */}
      {workers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Workers</h2>
            <Link href="/workers" className="flex items-center gap-1 text-sm text-brand-600 hover:underline font-medium">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
          </div>
        </section>
      )}

      {/* CTA join as worker */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Are You a Skilled Professional?</h2>
          <p className="text-gray-400 mb-8">
            Join Sabi Wok, set your own rates, manage your schedule, and get paid securely. Thousands of clients are looking for your skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=worker">
              <Button size="lg" className="w-full sm:w-auto">Register as a Worker</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800">
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
