import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminDisputeList } from "./dispute-list";
import { AdminWorkerList } from "./worker-list";
import { formatCurrency } from "@/lib/utils";
import { Users, Briefcase, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";

async function getStats() {
  const [
    totalWorkers, totalClients, totalBookings, totalRevenue,
    openDisputes, pendingVerifications, recentBookings,
  ] = await Promise.all([
    prisma.workerProfile.count(),
    prisma.clientProfile.count(),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.payment.aggregate({ where: { status: "RELEASED" }, _sum: { amount: true } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.workerProfile.count({ where: { isVerified: false, registrationPaid: true } }),
    prisma.booking.findMany({
      take: 10, orderBy: { createdAt: "desc" },
      include: { client: true, worker: { include: { user: true } }, payment: true },
    }),
  ]);

  const commissionEstimate = Number(totalRevenue._sum.amount ?? 0) * 0.12;

  return { totalWorkers, totalClients, totalBookings, commissionEstimate, openDisputes, pendingVerifications, recentBookings };
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  const stats = await getStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Workers", value: stats.totalWorkers, icon: Briefcase, color: "text-brand-600" },
          { label: "Clients", value: stats.totalClients, icon: Users, color: "text-blue-600" },
          { label: "Jobs Done", value: stats.totalBookings, icon: TrendingUp, color: "text-green-600" },
          { label: "Revenue (est.)", value: formatCurrency(stats.commissionEstimate), icon: DollarSign, color: "text-green-700" },
          { label: "Open Disputes", value: stats.openDisputes, icon: AlertTriangle, color: "text-red-500" },
          { label: "Pending Verify", value: stats.pendingVerifications, icon: Users, color: "text-yellow-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card className="mb-8">
        <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 pr-4">Client</th>
                  <th className="pb-2 pr-4">Worker</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Payment</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium">{b.client.name}</td>
                    <td className="py-2 pr-4">{b.worker.user.name}</td>
                    <td className="py-2 pr-4">{formatCurrency(Number(b.totalAmount))}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={b.status === "COMPLETED" ? "success" : b.status === "DISPUTED" ? "danger" : "secondary"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={b.payment?.status === "RELEASED" ? "success" : "warning"}>
                        {b.payment?.status || "NONE"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AdminDisputeList />
        <AdminWorkerList />
      </div>
    </div>
  );
}
