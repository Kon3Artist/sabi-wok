"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, calcPlatformFee, calcWorkerPayout } from "@/lib/utils";
import { Shield, Clock } from "lucide-react";

interface BookingForm {
  scheduledStart: string;
  scheduledEnd: string;
  address: string;
  description: string;
  skillId: string;
}

export default function BookingPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingForm>();

  const startTime = watch("scheduledStart");
  const endTime = watch("scheduledEnd");

  useEffect(() => {
    fetch(`/api/workers/${workerId}`).then(r => r.json()).then(setWorker);
  }, [workerId]);

  const hours = startTime && endTime
    ? Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000)
    : 0;
  const total = worker?.hourlyRate ? hours * Number(worker.hourlyRate) : 0;
  const fee = calcPlatformFee(total);
  const workerGets = calcWorkerPayout(total);

  async function onSubmit(data: BookingForm) {
    if (!session) return router.push("/login");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workerId, totalAmount: total }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Booking failed");
      // redirect to payment
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        router.push(`/dashboard/client?booked=${result.booking.id}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!worker) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Book {worker.user?.name}</h1>
      <p className="text-gray-500 mb-8">Fill in the details and pay securely to confirm your booking.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Service */}
        <Card>
          <CardHeader><CardTitle className="text-base">Service Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service / Skill</label>
              <Select onValueChange={(v) => setValue("skillId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {worker.skills?.map((ws: any) => (
                    <SelectItem key={ws.skill.id} value={ws.skill.id}>{ws.skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <Textarea
                {...register("description", { required: "Please describe the job" })}
                placeholder="Describe what needs to be done..."
                rows={3}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
              <Input {...register("address", { required: "Address is required" })} placeholder="Full address..." />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader><CardTitle className="text-base">Schedule</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <Input type="datetime-local" {...register("scheduledStart", { required: true })} min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <Input type="datetime-local" {...register("scheduledEnd", { required: true })} />
            </div>
            {hours > 0 && (
              <div className="col-span-2 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4" />
                Duration: <span className="font-medium text-gray-700">{hours.toFixed(1)} hours</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price breakdown */}
        {total > 0 && (
          <Card className="border-brand-200 bg-brand-50">
            <CardHeader><CardTitle className="text-base text-brand-800">Payment Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{hours.toFixed(1)}h × {formatCurrency(Number(worker.hourlyRate))}/hr</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform fee (12%)</span>
                <span>{formatCurrency(fee)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Worker receives</span>
                <span>{formatCurrency(workerGets)}</span>
              </div>
              <hr className="border-brand-200" />
              <div className="flex justify-between font-bold text-brand-900 text-base">
                <span>Total (escrowed)</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Escrow notice */}
        <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <Shield className="h-5 w-5 shrink-0 mt-0.5" />
          <p>Your payment is held safely in escrow and only released to the worker once you confirm the job is complete. You are protected.</p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading || total === 0}>
          {loading ? "Processing..." : `Pay & Confirm Booking — ${formatCurrency(total)}`}
        </Button>
      </form>
    </div>
  );
}
