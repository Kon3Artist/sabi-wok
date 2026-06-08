"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatarFallback } from "@/lib/utils";
import { ClipboardList, MapPin, Camera, Calendar, CheckCircle } from "lucide-react";

interface RequestForm {
  title: string;
  description: string;
  address: string;
  preferredDate: string;
  skillId: string;
}

export default function RequestQuotePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RequestForm>();

  useEffect(() => {
    fetch(`/api/workers/${workerId}`).then(r => r.json()).then(setWorker);
  }, [workerId]);

  async function onSubmit(data: RequestForm) {
    if (!session) return router.push("/login");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, workerProfileId: worker.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send request");
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!worker) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
        <p className="text-gray-500 mb-6">
          <strong>{worker.user?.name}</strong> will review your job and send you a quote. You'll be notified when it arrives.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6 text-left">
          <p className="font-semibold mb-1">What happens next?</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700">
            <li>Worker reviews your request</li>
            <li>Worker sends you a quote with price breakdown</li>
            <li>You accept or reject the quote</li>
            <li>If accepted, you pay into escrow — work begins</li>
            <li>You confirm completion — worker gets paid</li>
          </ol>
        </div>
        <Button onClick={() => router.push("/dashboard/client")} className="w-full">
          View My Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Worker mini-profile */}
      <div className="flex items-center gap-3 mb-6 bg-white border border-gray-200 rounded-xl p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={worker.user?.image ?? ""} />
          <AvatarFallback>{avatarFallback(worker.user?.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-gray-900">{worker.user?.name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {worker.location ?? "Sierra Leone"}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400">Pricing mode</p>
          <p className="text-sm font-semibold text-brand-600">Quote after assessment</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Request a Quote</h1>
      <p className="text-gray-500 text-sm mb-8">
        Describe the job. {worker.user?.name?.split(" ")[0]} will assess it and send you a price — no payment yet.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <Input {...register("title", { required: "Please give your job a title" })} placeholder="e.g. Fix leaking pipe in bathroom" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service / Skill Needed</label>
              <Select onValueChange={(v) => setValue("skillId", v)}>
                <SelectTrigger><SelectValue placeholder="Select a skill..." /></SelectTrigger>
                <SelectContent>
                  {worker.skills?.map((ws: any) => (
                    <SelectItem key={ws.skill.id} value={ws.skill.id}>{ws.skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <Textarea
                {...register("description", { required: "Please describe the job in detail", minLength: { value: 20, message: "Please give more detail (min 20 chars)" } })}
                placeholder="Describe the problem or work needed in as much detail as possible. The more detail, the more accurate the quote will be."
                rows={5}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Location & Timing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Address</label>
              <Input {...register("address", { required: "Address is required" })} placeholder="Full address where work will be done" />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date (optional)</label>
              <Input type="date" {...register("preferredDate")} min={new Date().toISOString().split("T")[0]} />
            </div>
          </CardContent>
        </Card>

        {/* Photos hint */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <Camera className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Tip: Adding photos of the problem helps workers give a more accurate quote. Photo upload coming soon.</p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Sending Request..." : "Send Job Request — No payment yet"}
        </Button>
        <p className="text-xs text-center text-gray-400">
          You only pay after reviewing and accepting the worker's quote.
        </p>
      </form>
    </div>
  );
}
