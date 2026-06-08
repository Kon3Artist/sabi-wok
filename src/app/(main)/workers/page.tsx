import { prisma } from "@/lib/prisma";
import { WorkerCard } from "@/components/workers/worker-card";
import { WorkersFilter } from "@/components/workers/workers-filter";
import type { WorkerWithRelations } from "@/types";

interface PageProps {
  searchParams: { category?: string; availability?: string; tier?: string; q?: string };
}

async function getWorkers(params: PageProps["searchParams"]): Promise<WorkerWithRelations[]> {
  const where: any = { registrationPaid: true };

  if (params.availability) where.availability = params.availability;
  if (params.tier) where.tier = params.tier;
  if (params.category) {
    where.skills = { some: { skill: { category: { slug: params.category } } } };
  }
  if (params.q) {
    where.OR = [
      { user: { name: { contains: params.q, mode: "insensitive" } } },
      { bio: { contains: params.q, mode: "insensitive" } },
      { skills: { some: { skill: { name: { contains: params.q, mode: "insensitive" } } } } },
    ];
  }

  return prisma.workerProfile.findMany({
    where,
    orderBy: [{ featuredUntil: "desc" }, { avgRating: "desc" }],
    include: {
      user: true,
      skills: { include: { skill: { include: { category: true } } } },
      reviewsReceived: { include: { reviewer: true }, take: 3 },
      portfolioImages: { take: 3 },
    },
  }) as Promise<WorkerWithRelations[]>;
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function WorkersPage({ searchParams }: PageProps) {
  const [workers, categories] = await Promise.all([getWorkers(searchParams), getCategories()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Workers</h1>
        <p className="text-gray-500 mt-1">Browse verified skilled professionals across Sierra Leone</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <WorkersFilter categories={categories} current={searchParams} />
        </aside>

        {/* Results */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">{workers.length} workers found</p>
          {workers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">No workers found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
