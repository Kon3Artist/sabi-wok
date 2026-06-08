import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const workerPlans = [
  {
    name: "Basic",
    price: "Le 150,000",
    period: "one-time registration",
    desc: "Get started on the platform",
    features: ["Profile listing", "Up to 10 bookings/month", "Secure payments", "Client reviews", "Basic support"],
    cta: "Join as Basic",
    href: "/register?role=worker",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Le 50,000",
    period: "/month",
    desc: "For serious full-time professionals",
    features: ["Everything in Basic", "Unlimited bookings", "Priority search placement", "Analytics dashboard", "Response time badge", "Pro badge"],
    cta: "Go Pro",
    href: "/register?role=worker&tier=pro",
    highlight: true,
  },
  {
    name: "Elite",
    price: "Le 100,000",
    period: "/month",
    desc: "Maximum visibility & credibility",
    features: ["Everything in Pro", "Top of search results", "Featured on homepage", "✦ Elite badge", "Verified fast-track", "Priority dispute resolution"],
    cta: "Go Elite",
    href: "/register?role=worker&tier=elite",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple, Transparent Pricing</h1>
        <p className="text-gray-500 text-lg">Grow your business with the right plan. All workers pay a 12% commission on completed jobs.</p>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6">Worker Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {workerPlans.map((plan) => (
          <Card key={plan.name} className={plan.highlight ? "border-brand-500 ring-2 ring-brand-400 shadow-lg" : ""}>
            {plan.highlight && (
              <div className="bg-brand-600 text-white text-xs font-bold text-center py-1.5 rounded-t-xl">MOST POPULAR</div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 text-sm"> {plan.period}</span>
              </div>
              <p className="text-sm text-gray-500">{plan.desc}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="block mt-4">
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>{plan.cta}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-brand-50 border-brand-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-1">Client Subscription (Optional)</h3>
          <p className="text-gray-600 text-sm mb-3">Frequent clients can subscribe for Le 30,000/month to get reduced platform fees, priority booking, and saved payment methods.</p>
          <Link href="/register">
            <Button variant="outline">Sign Up as Client</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
