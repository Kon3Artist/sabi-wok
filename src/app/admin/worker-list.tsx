import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallback } from "@/lib/utils";

export async function AdminWorkerList() {
  const workers = await prisma.workerProfile.findMany({
    where: { registrationPaid: true },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Recent Workers</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workers.map((w) => (
            <div key={w.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={w.user.image ?? ""} />
                <AvatarFallback>{avatarFallback(w.user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{w.user.name}</p>
                <p className="text-xs text-gray-400">{w.user.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={w.isVerified ? "verified" : "warning"}>
                  {w.isVerified ? "Verified" : "Pending"}
                </Badge>
                {!w.isVerified && (
                  <form action={`/api/admin/verify/${w.userId}`} method="POST">
                    <Button size="sm" type="submit">Verify</Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
