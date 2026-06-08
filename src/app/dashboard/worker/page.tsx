"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Briefcase, DollarSign, Star, Calendar, CheckCircle, Clock, AlertTriangle, ClipboardList, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingWithRelations } from "@/types";

const statusColors = {
  PENDING: "warning",
  ACCEPTED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  CANCELLED: "danger",
  DISPUTED: "danger",
} as const;

export default function WorkerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [availability, setAvailability] = useState("AVAILABLE");
  const [loading, setLoading] = useState(true);
  const [quoteModal, setQuoteModal] = useState<{ requestId: string; title: string } | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteBreakdown, setQuoteBreakdown] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteHours, setQuoteHours] = useState("");

  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "WORKER") router.push("/dashboard/client");
  }, [status, user]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/bookings?role=WORKER").then(r => r.json()),
      fetch(`/api/workers/${user?.id}`).then(r => r.json()),
      fetch("/api/job-requests?role=WORKER").then(r => r.json()),
    ]).then(([b, p, jr]) => {
      setBookings(b);
      setProfile(p);
      setJobRequests(jr);
      setAvailability(p.availability);
      setLoading(false);
    });
  }, [status]);

  async function updateAvailability(val: string) {
    setAvailability(val);
    await fetch(`/api/workers/${user?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: val }),
    });
  }

  async function handleBookingAction(bookingId: string, action: string) {
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const updated = await fetch("/api/bookings?role=WORKER").then(r => r.json());
    setBookings(updated);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const totalEarned = bookings.filter(b => b.status === "COMPLETED").reduce((s, b) => s + Number(b.workerPayout), 0);
  const completedCount = bookings.filter(b => b.status === "COMPLETED").length;
  const pendingCount = bookings.filter(b => b.status === "PENDING").length;
  const openRequests = jobRequests.filter(r => r.status === "OPEN");

  async function sendQuote() {
    if (!quoteModal) return;
    await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobRequestId: quoteModal.requestId,
        amount: parseFloat(quoteAmount),
        breakdown: quoteBreakdown,
        estimatedHours: quoteHours ? parseFloat(quoteHours) : undefined,
        message: quoteMessage,
      }),
    });
    setQuoteModal(null);
    setQuoteAmount(""); setQuoteBreakdown(""); setQuoteMessage(""); setQuoteHours("");
    const jr = await fetch("/api/job-requests?role=WORKER").then(r => r.json());
    setJobRequests(jr);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name?.split(" ")[0]}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <Select value={availability} onValueChange={updateAvailability}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">🟢 Available Now</SelectItem>
              <SelectItem value="SCHEDULED">🔵 Scheduled</SelectItem>
              <SelectItem value="OFFLINE">⚫ Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Earned", value: formatCurrency(totalEarned), icon: DollarSign, color: "text-green-600" },
          { label: "Jobs Done", value: completedCount, icon: Briefcase, color: "text-brand-600" },
          { label: "Quote Requests", value: openRequests.length, icon: ClipboardList, color: "text-purple-600" },
          { label: "Rating", value: profile?.avgRating?.toFixed(1) || "—", icon: Star, color: "text-yellow-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-gray-900 text-lg">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registration fee warning */}
      {!profile?.registrationPaid && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Complete your registration</p>
            <p className="text-sm text-amber-700">Pay the one-time registration fee of Le 150,000 to activate your profile and start accepting bookings.</p>
            <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700" onClick={() => router.push("/onboarding/payment")}>
              Pay Registration Fee
            </Button>
          </div>
        </div>
      )}

      {/* Bookings */}
      <Tabs defaultValue="quote-requests">
        <TabsList>
          <TabsTrigger value="quote-requests">Quote Requests ({openRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">Bookings ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="quote-requests">
          <div className="space-y-3">
            {openRequests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-400">No quote requests yet.</CardContent></Card>
            ) : (
              openRequests.map((req: any) => (
                <Card key={req.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{req.client.name}</span>
                          <Badge variant="secondary" className="text-xs">Quote Requested</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1">{req.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{req.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          <span>📍 {req.address}</span>
                          {req.preferredDate && <span>📅 {formatDate(req.preferredDate)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {req.quotes.length === 0 ? (
                          <Button size="sm" onClick={() => setQuoteModal({ requestId: req.id, title: req.title })}>
                            <Send className="w-3.5 h-3.5 mr-1" /> Send Quote
                          </Button>
                        ) : (
                          <Badge variant="success">Quote Sent</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {["pending", "active", "completed", "all"].map((tab) => {
          const filtered = bookings.filter(b =>
            tab === "pending" ? b.status === "PENDING" :
            tab === "active" ? ["ACCEPTED", "IN_PROGRESS"].includes(b.status) :
            tab === "completed" ? b.status === "COMPLETED" : true
          );

          return (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-gray-400">No bookings here yet.</CardContent></Card>
                ) : (
                  filtered.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{booking.client.name}</span>
                              <Badge variant={statusColors[booking.status] as any}>{booking.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{booking.description}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateTime(booking.scheduledStart)}</span>
                              <span className="font-medium text-gray-700">{formatCurrency(Number(booking.workerPayout))} (your payout)</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {booking.status === "PENDING" && (
                              <>
                                <Button size="sm" onClick={() => handleBookingAction(booking.id, "accept")}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleBookingAction(booking.id, "cancel")}>Decline</Button>
                              </>
                            )}
                            {booking.status === "ACCEPTED" && (
                              <Button size="sm" onClick={() => handleBookingAction(booking.id, "start")}>Start Job</Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    {/* Send Quote Modal */}
      <Dialog open={!!quoteModal} onOpenChange={() => setQuoteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Quote</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{quoteModal?.title}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Total Price (Le)</label>
              <Input
                type="number"
                placeholder="e.g. 250000"
                value={quoteAmount}
                onChange={e => setQuoteAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Breakdown (optional)</label>
              <Textarea
                placeholder="e.g. Labour: Le 150,000 · Materials: Le 100,000"
                value={quoteBreakdown}
                onChange={e => setQuoteBreakdown(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours (optional)</label>
              <Input
                type="number"
                placeholder="e.g. 4"
                value={quoteHours}
                onChange={e => setQuoteHours(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message to Client (optional)</label>
              <Textarea
                placeholder="Any notes, conditions, or questions for the client..."
                value={quoteMessage}
                onChange={e => setQuoteMessage(e.target.value)}
                rows={2}
              />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
              The platform fee (12%) will be deducted from this amount. You will receive{" "}
              <strong>{quoteAmount ? formatCurrency(Math.round(parseFloat(quoteAmount) * 0.88)) : "—"}</strong> when the job is confirmed complete.
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setQuoteModal(null)}>Cancel</Button>
            <Button onClick={sendQuote} disabled={!quoteAmount || parseFloat(quoteAmount) <= 0}>
              <Send className="w-4 h-4 mr-1" /> Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
