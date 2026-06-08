"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Bell, Menu, X, Briefcase, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { avatarFallback } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = session?.user as any;

  const dashboardHref = user?.role === "WORKER" ? "/dashboard/worker" : user?.role === "ADMIN" ? "/admin" : "/dashboard/client";

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Sabi <span className="text-brand-600">Wok</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/workers" className="text-sm text-gray-600 hover:text-brand-600 font-medium">Find Workers</Link>
            <Link href="/workers?category=electrical" className="text-sm text-gray-600 hover:text-brand-600 font-medium">Categories</Link>
            <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-brand-600 font-medium">How It Works</Link>
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full hover:bg-gray-50 p-1 pr-2 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image ?? ""} />
                      <AvatarFallback>{avatarFallback(user?.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link href={dashboardHref} onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50">Dashboard</Link>
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50">Profile Settings</Link>
                      {user?.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50">Admin Panel</Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
                <Link href="/register"><Button size="sm">Get Started</Button></Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link href="/workers" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>Find Workers</Link>
          <Link href="/how-it-works" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>How It Works</Link>
          {session ? (
            <>
              <Link href={dashboardHref} className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left text-red-600 font-medium py-2">Sign Out</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Log In</Button></Link>
              <Link href="/register" className="flex-1"><Button className="w-full">Get Started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
