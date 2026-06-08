import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/workers/star-rating";
import { CheckCircle, MapPin, Clock, Briefcase, Calendar, Star, ClipboardList } from "lucide-react";
import { avatarFallback, formatCurrency, formatDate } from "@/lib/utils";
import type { WorkerWithRelations } from "@/types";

async function getWorker(userId: string): Promise<WorkerWithRelations | null> {
  return prisma.workerProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      skills: { include: { skill: { include: { category: true } } } },
      reviewsReceived: { include: { reviewer: true }, orderBy: { createdAt: "desc" } },
      portfolioImages: true,
    },
  }) as Promise<WorkerWithRelations | null>;
}

const availabilityBadge = {
  AVAILABLE: { label: "Available Now", variant: "success" as const, dot: "bg-green-500" },
  ON_JOB: { label: "Currently On a Job", variant: "warning" as const, dot: "bg-yellow-500" },
  SCHEDULED: { label: "Scheduled — Taking Future Bookings", variant: "secondary" as const, dot: "bg-blue-400" },
  OFFLINE: { label: "Offline", variant: "secondary" as const, dot: "bg-gray-400" },
};

export default async function WorkerProfilePage({ params }: { params: { id: string } }) {
  const [worker, session] = await Promise.all([getWorker(params.id), getServerSession(authOptions)]);

  if (!worker) notFound();

  const avail = availabilityBadge[worker.availability];
  const canBook = session && (session.user as any).id !== worker.userId;

  const skillsByCategory = worker.skills.reduce((acc, ws) => {
    const cat = ws.skill.category.name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ws);
    return acc;
  }, {} as Record<string, typeof worker.skills>);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: profile info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={worker.user.image ?? ""} />
                    <AvatarFallback className="text-2xl">{avatarFallback(worker.user.name)}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${avail.dot}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{worker.user.name}</h1>
                    {worker.isVerified && (
                      <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> Verified
                      </span>
                    )}
                    {worker.tier === "ELITE" && <Badge variant="elite">✦ Elite</Badge>}
                    {worker.tier === "PRO" && <Badge variant="pro">Pro</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    {worker.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{worker.location}</span>
                    )}
                    {worker.avgRating > 0 && (
                      <span className="flex items-center gap-1">
                        <StarRating rating={Math.round(worker.avgRating)} size="sm" />
                        <span className="font-medium text-gray-700">{worker.avgRating.toFixed(1)}</span>
                        <span>({worker.reviewsReceived.length} reviews)</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{worker.totalJobsDone} jobs completed</span>
                    {worker.responseTimeMin && (
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Responds in ~{worker.responseTimeMin}min</span>
                    )}
                  </div>

                  <Badge variant={avail.variant} className="mt-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${avail.dot} mr-1`} />
                    {avail.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: About / Skills / Portfolio / Reviews */}
          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({worker.reviewsReceived.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {worker.bio || "This worker hasn't added a bio yet."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {Object.entries(skillsByCategory).map(([cat, skills]) => (
                    <div key={cat}>
                      <h3 className="font-semibold text-gray-700 mb-2">{cat}</h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((ws) => (
                          <Badge key={ws.id} variant="outline">
                            {ws.skill.name}
                            {ws.yearsExp && <span className="text-gray-400 ml-1">· {ws.yearsExp}yr</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio">
              <Card>
                <CardContent className="p-6">
                  {worker.portfolioImages.length === 0 ? (
                    <p className="text-gray-400 text-sm">No portfolio images yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {worker.portfolioImages.map((img) => (
                        <div key={img.id} className="rounded-lg overflow-hidden aspect-square bg-gray-100 relative">
                          <Image src={img.url} alt={img.caption || "Portfolio"} fill className="object-cover" />
                          {img.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 text-center">{img.caption}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-3">
                {worker.reviewsReceived.length === 0 ? (
                  <Card><CardContent className="p-6 text-gray-400 text-sm">No reviews yet.</CardContent></Card>
                ) : (
                  worker.reviewsReceived.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={review.reviewer.image ?? ""} />
                            <AvatarFallback>{avatarFallback(review.reviewer.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-gray-900">{review.reviewer.name}</span>
                              <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                            {review.comment && <p className="text-sm text-gray-600 mt-1">{review.comment}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: booking card */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Book {worker.user.name?.split(" ")[0]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {worker.pricingMode === "HOURLY" && worker.hourlyRate ? (
                <div className="text-center py-2 bg-brand-50 rounded-lg">
                  <span className="text-2xl font-bold text-brand-700">{formatCurrency(Number(worker.hourlyRate))}</span>
                  <span className="text-brand-500">/hr</span>
                </div>
              ) : worker.pricingMode === "QUOTE" ? (
                <div className="text-center py-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm font-semibold text-amber-700">Price by Quote</p>
                  <p className="text-xs text-amber-600 mt-0.5">Worker assesses the job first</p>
                </div>
              ) : null}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant={avail.variant}>{avail.label}</Badge>
                </div>
                {worker.serviceRadius && (
                  <div className="flex items-center justify-between">
                    <span>Service radius</span>
                    <span className="font-medium">{worker.serviceRadius} km</span>
                  </div>
                )}
              </div>

              {canBook ? (
                worker.pricingMode === "QUOTE" ? (
                  <div className="space-y-2">
                    <Link href={`/request/${worker.userId}`} className="block">
                      <Button className="w-full" size="lg" disabled={worker.availability === "OFFLINE"}>
                        <ClipboardList className="w-4 h-4 mr-2" />
                        {worker.availability === "OFFLINE" ? "Currently Unavailable" : "Request a Quote"}
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-gray-400">Worker assesses the job and sends you a price</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href={`/book/${worker.userId}`} className="block">
                      <Button className="w-full" size="lg" disabled={worker.availability === "OFFLINE"}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {worker.availability === "OFFLINE" ? "Currently Unavailable" : "Book Now"}
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-gray-400">Pay by the hour — set your schedule upfront</p>
                  </div>
                )
              ) : !session ? (
                <Link href="/login" className="block">
                  <Button className="w-full" size="lg">Log In to Book</Button>
                </Link>
              ) : null}

              <p className="text-xs text-gray-400 text-center">
                Payment held in escrow — released only after job completion
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
