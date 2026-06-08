import Link from "next/link";
import { Star, MapPin, CheckCircle, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { avatarFallback, formatCurrency } from "@/lib/utils";
import type { WorkerWithRelations } from "@/types";

interface WorkerCardProps {
  worker: WorkerWithRelations;
}

const availabilityConfig = {
  AVAILABLE: { label: "Available Now", color: "success", dot: "bg-green-500" },
  ON_JOB: { label: "On a Job", color: "warning", dot: "bg-yellow-500" },
  SCHEDULED: { label: "Scheduled", color: "secondary", dot: "bg-blue-400" },
  OFFLINE: { label: "Offline", color: "secondary", dot: "bg-gray-400" },
} as const;

const tierConfig = {
  BASIC: null,
  PRO: { label: "Pro", variant: "pro" as const },
  ELITE: { label: "Elite ✦", variant: "elite" as const },
};

export function WorkerCard({ worker }: WorkerCardProps) {
  const avail = availabilityConfig[worker.availability];
  const tier = tierConfig[worker.tier];
  const primarySkills = worker.skills.slice(0, 3).map((ws) => ws.skill.name);

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src={worker.user.image ?? ""} alt={worker.user.name ?? ""} />
              <AvatarFallback className="text-lg">{avatarFallback(worker.user.name)}</AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${avail.dot}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{worker.user.name}</h3>
              {worker.isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              {tier && <Badge variant={tier.variant}>{tier.label}</Badge>}
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {worker.avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-700">{worker.avgRating.toFixed(1)}</span>
                  <span>({worker.reviewsReceived.length})</span>
                </span>
              )}
              {worker.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {worker.location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`flex items-center gap-1 text-xs font-medium`}>
                <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
                {avail.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {primarySkills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            {worker.pricingMode === "HOURLY" && worker.hourlyRate ? (
              <div className="text-sm">
                <span className="font-semibold text-gray-900">{formatCurrency(Number(worker.hourlyRate))}</span>
                <span className="text-gray-500">/hr</span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-amber-600">Quote-based</div>
            )}
            <div className="text-xs text-gray-400">{worker.totalJobsDone} jobs done</div>
          </div>
          <Link href={`/workers/${worker.userId}`}>
            <Button size="sm" className="group-hover:bg-brand-700">View Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
