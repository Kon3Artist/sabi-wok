import Link from "next/link";
import { Briefcase } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Sabi Wok</span>
            </div>
            <p className="text-sm leading-relaxed">
              Sierra Leone's trusted platform for skilled tradespeople and reliable services.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/workers" className="hover:text-white transition-colors">Find Workers</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">For Workers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register?role=worker" className="hover:text-white transition-colors">Join as Worker</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
              <li><Link href="/dashboard/worker" className="hover:text-white transition-colors">Worker Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/worker-agreement" className="hover:text-white transition-colors">Worker Agreement</Link></li>
              <li><Link href="/disputes" className="hover:text-white transition-colors">Dispute Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          © {new Date().getFullYear()} Sabi Wok. All rights reserved. Workers are independent contractors.
        </div>
      </div>
    </footer>
  );
}
