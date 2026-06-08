import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export async function AdminDisputeList() {
  const disputes = await prisma.dispute.findMany({
    where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    include: { booking: { include: { client: true, worker: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Open Disputes</CardTitle></CardHeader>
      <CardContent>
        {disputes.length === 0 ? (
          <p className="text-sm text-gray-400">No open disputes.</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{d.booking.client.name} vs {d.booking.worker.user.name}</span>
                  <Badge variant="danger">{d.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{d.reason}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{formatDate(d.createdAt)}</span>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
