"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"CLIENT" | "WORKER">(
    searchParams.get("role") === "worker" ? "WORKER" : "CLIENT"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registration failed");
      router.push(role === "WORKER" ? "/dashboard/worker?onboarding=1" : "/dashboard/client");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Sabi Wok</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: "CLIENT" as const, label: "I Need Services", sub: "Book skilled workers", icon: User },
            { value: "WORKER" as const, label: "I Provide Services", sub: "Get hired & earn", icon: Wrench },
          ].map(({ value, label, sub, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setRole(value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                role === value ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", role === value ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500")}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={cn("font-semibold text-sm", role === value ? "text-brand-700" : "text-gray-700")}>{label}</div>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <Input placeholder="Full name" {...register("name", { required: "Name is required" })} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Input type="email" placeholder="Email address" {...register("email", { required: "Email is required" })} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Input placeholder="Phone number" {...register("phone")} />
              </div>
              <div>
                <Input type="password" placeholder="Password (min 8 chars)" {...register("password", { required: true, minLength: { value: 8, message: "Min 8 characters" } })} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {role === "WORKER" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  A one-time registration fee of <strong>Le 150,000</strong> is required to activate your worker profile.
                </div>
              )}

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          By registering you agree to our{" "}
          <Link href="/terms" className="underline">Terms of Service</Link>,{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
          {role === "WORKER" && <>, and <Link href="/worker-agreement" className="underline">Worker Agreement</Link></>}.
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
