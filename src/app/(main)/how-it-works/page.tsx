import { Search, Calendar, Shield, CheckCircle, Star, DollarSign } from "lucide-react";

const clientSteps = [
  { icon: Search, title: "Browse & Find", desc: "Search by category or skill. Filter by availability, rating, or tier. Every worker profile shows live status." },
  { icon: Calendar, title: "Book & Schedule", desc: "Pick a time that works. Fill in your address and job details. The worker confirms within minutes." },
  { icon: Shield, title: "Pay Securely", desc: "Your payment goes into escrow — not to the worker yet. You're fully protected until the job is done." },
  { icon: CheckCircle, title: "Confirm & Release", desc: "Once satisfied, tap 'Confirm Done'. Payment is instantly released to the worker. Leave a review." },
];

const workerSteps = [
  { icon: DollarSign, title: "Register & Pay Fee", desc: "Pay the one-time Le 150,000 registration fee. This keeps our platform professional and serious workers only." },
  { icon: CheckCircle, title: "Get Verified", desc: "Submit your ID for verification. Get the blue Verified badge that boosts client trust and bookings." },
  { icon: Calendar, title: "Manage Your Schedule", desc: "Set your availability, update your status live, accept or decline bookings. You're always in control." },
  { icon: Star, title: "Build Your Reputation", desc: "Complete jobs, earn reviews, and climb to Pro or Elite tier for more visibility and higher-value clients." },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">How Sabi Wok Works</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">Secure, simple, and transparent — for both clients and workers.</p>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {clientSteps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-brand-600" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Workers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workerSteps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-gray-600" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
