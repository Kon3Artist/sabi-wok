"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Category } from "@prisma/client";

interface WorkersFilterProps {
  categories: Category[];
  current: Record<string, string | undefined>;
}

export function WorkersFilter({ categories, current }: WorkersFilterProps) {
  const router = useRouter();

  function apply(key: string, value: string | null) {
    const params = new URLSearchParams(current as any);
    if (value === null || params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/workers?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {[
            { value: "AVAILABLE", label: "Available Now", dot: "bg-green-500" },
            { value: "SCHEDULED", label: "Scheduled", dot: "bg-blue-400" },
            { value: "ON_JOB", label: "On a Job", dot: "bg-yellow-500" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => apply("availability", opt.value)}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${current.availability === opt.value ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Worker Tier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {[
            { value: "ELITE", label: "✦ Elite" },
            { value: "PRO", label: "Pro" },
            { value: "BASIC", label: "Basic" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => apply("tier", opt.value)}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${current.tier === opt.value ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => apply("category", cat.slug)}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${current.category === cat.slug ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </CardContent>
      </Card>

      {Object.keys(current).length > 0 && (
        <Button variant="ghost" className="w-full text-gray-500" onClick={() => router.push("/workers")}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
