"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/workers/star-rating";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { Calendar, CheckCircle, Search, AlertCircle, ClipboardList, ThumbsUp, ThumbsDown } from "lucide-react";
import type { BookingWithRelations } from "@/types";

const statusColors = { PENDING: "warning", ACCEPTED: "secondary", IN_PROGRESS: "default", COMPLETED: "success", CANCELLED: "danger", DISPUTED: "danger" } as const;

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ bookingId: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [disputeModal, setDisputeModal] = useState<{ bookingId: string } | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/bookings").then(r => r.json()),
      fetch("/api/job-requests").then(r => r.json()),
    ]).then(([b, jr]) => {
      setBookings(b);
      setJobRequests(jr);
      setLoading(false);
    });
  }, [status]);

  const paymentStatus = searchParams.get("payment");

  const pendingQuotes = jobRequests.flatMap((r: any) =>
    r.quotes.filter((q: any) => q.status === "SENT").map((q: any) => ({ ...q, jobRequest: r }))
  );

  async function handleQuote(quoteId: string, action: "accept" | "reject") {
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await res.json();
    if (action === "accept" && result.paymentUrl) {
      window.location.href = result.paymentUrl;
    } else {
      const [b, jr] = await Promise.all([
        fetch("/api/bookings").then(r => r.json()),
        fetch("/api/job-requests").then(r => r.json()),
      ]);
      setBookings(b); setJobRequests(jr);
    }
  }

  async function confirmComplete(bookingId: string) {
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    const updated = await fetch("/api/bookings").then(r => r.json());
    setBookings(updated);
    setReviewModal({ bookingId });
  }

  async function submitReview() {
    if (!reviewModal) return;
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: reviewModal.bookingId, rating, comment }),
    });
    setReviewModal(null);
  }

  async function submitDispute() {
    if (!disputeModal) return;
    await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: disputeModal.bookingId, reason: disputeReason }),
    });
    setDisputeModal(null);
    const updated = await fetch("/api/bookings").then(r => r.json());
    setBookings(updated);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const active = bookings.filter(b => ["ACCEPTED", "IN_PROGRESS", "PENDING"].includes(b.status));
  const completed = bookings.filter(b => b.status === "COMPLETED");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500">Welcome back, {user?.name?.split(" ")[0]}</p>
        </div>
        <Link href="/workers">
          <Button><Search className="w-4 h-4 mr-2" /> Find a Worker</Button>
        </Link>
      </div>

      {paymentStatus === "success" && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Payment successful!</p>
            <p className="text-sm text-green-700">Your booking is confirmed and payment is held in escrow. The worker will be notified.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">
            Quotes {pendingQuotes.length > 0 && <span className="ml-1 bg-brand-600 text-white text-xs rounded-full px-1.5">{pendingQuotes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes">
          <div className="space-y-3">
            {pendingQuotes.length === 0 && jobRequests.filter((r: any) => r.status === "OPEN").length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-400">No quote requests yet. <Link href="/workers" className="text-brand-600 underline">Find a worker</Link> to get a quote.</CardContent></Card>
            ) : (
              <>
                {pendingQuotes.map((quote: any) => (
                  <Card key={quote.id} className="border-brand-200 bg-brand-50">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">Quote Received!</span>
                            <Badge variant="default">Review Now</Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-700">{quote.jobRequest.title}</p>
                          <p className="text-sm text-gray-500">from {quote.worker?.user?.name ?? "Worker"}</p>
                          <div className="mt-3 bg-white rounded-lg border border-brand-100 p-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Quoted price</span>
                              <span className="font-bold text-gray-900 text-base">{formatCurrency(Number(quote.amount))}</span>
                            </div>
                            {quote.estimatedHours && (
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Estimated duration</span>
                                <span>{quote.estimatedHours}h</span>
                              </div>
                            )}
                            {quote.breakdown && (
                              <p className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">{quote.breakdown}</p>
                            )}
                            {quote.message && (
                              <p className="text-xs text-gray-600 italic">"{quote.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap sm:flex-col">
                          <Button size="sm" onClick={() => handleQuote(quote.id, "accept")} className="bg-green-600 hover:bg-green-700">
                            <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Accept & Pay
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleQuote(quote.id, "reject")} className="text-red-600 border-red-200 hover:bg-red-50">
                            <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {jobRequests.filter((r: any) => r.status === "OPEN").map((req: any) => (
                  <Card key={req.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <ClipboardList className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-800">{req.title}</span>
                        <Badge variant="warning">Awaiting Quote</Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{req.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Sent to {req.worker?.user?.name} · {formatDate(req.createdAt)}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        {[["active", active], ["completed", completed], ["all", bookings]].map(([tab, items]) => (
          <TabsContent key={tab as string} value={tab as string}>
            <div className="space-y-3">
              {(items as BookingWithRelations[]).length === 0 ? (
                <Card><CardContent className="p-8 text-center text-gray-400">No bookings here.</CardContent></Card>
              ) : (
                (items as BookingWithRelations[]).map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{booking.worker.user.name}</span>
                            <Badge variant={statusColors[booking.status] as any}>{booking.status.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{booking.description}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateTime(booking.scheduledStart)}</span>
                            <span className="font-medium text-gray-700">{formatCurrency(Number(booking.totalAmount))}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap shrink-0">
                          {booking.status === "IN_PROGRESS" && (
                            <>
                              <Button size="sm" onClick={() => confirmComplete(booking.id)}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirm Done
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setDisputeModal({ bookingId: booking.id })}>
                                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Dispute
                              </Button>
                            </>
                          )}
                          {booking.status === "COMPLETED" && !booking.review && (
                            <Button size="sm" variant="outline" onClick={() => setReviewModal({ bookingId: booking.id })}>
                              Leave Review
                            </Button>
                          )}
                          {booking.status === "COMPLETED" && booking.review && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Reviewed
                            </span>
                          )}
                          <Link href={`/workers/${booking.worker.userId}`}>
                            <Button size="sm" variant="ghost">View Profile</Button>
                          </Link>
                          <Link href={`/workers/${booking.worker.userId}`}>
                            <Button size="sm" variant="secondary">Book Again</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Review modal */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Leave a Review</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
              <StarRating rating={rating} interactive onChange={setRating} size="lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Comment (optional)</p>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="How was the service?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReviewModal(null)}>Skip</Button>
            <Button onClick={submitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute modal */}
      <Dialog open={!!disputeModal} onOpenChange={() => setDisputeModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-500">Payment will be held until our team resolves this dispute. Please provide a clear reason.</p>
            <Textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDisputeModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDispute} disabled={disputeReason.length < 20}>Submit Dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
