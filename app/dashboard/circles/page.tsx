import { PlusCircleIcon, UsersIcon, CalendarIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui/glass-card"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { circles as circlesTable, circleMembers, contributions as contributionsTable, rounds as roundsTable } from "@/lib/db/schema"
import { eq, and, inArray, sql, sum } from "drizzle-orm"
import Link from "next/link"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { cn } from "@/lib/utils"

export default async function CirclesPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const user = session?.user

  let userCircles: any[] = []
  let pendingRequestsRaw: any[] = []

  if (user) {
    const userCirclesRaw = await db
      .select({
         circle: circlesTable,
         memberStatus: circleMembers.status,
         requestedAt: circleMembers.joinedAt
      })
      .from(circleMembers)
      .innerJoin(circlesTable, eq(circleMembers.circleId, circlesTable.id))
      .where(eq(circleMembers.userId, user.id));
      
    userCircles = userCirclesRaw.filter(r => r.memberStatus === "accepted").map(r => r.circle);
    pendingRequestsRaw = userCirclesRaw.filter(r => r.memberStatus === "pending");

    if (userCircles.length > 0) {
      const circleIds = userCircles.map(c => c.id);
      
      // 3.1 Fetch member counts
      const memberCounts = await db
        .select({
          circleId: circleMembers.circleId,
          count: sql<number>`count(${circleMembers.id})`.mapWith(Number)
        })
        .from(circleMembers)
        .where(and(inArray(circleMembers.circleId, circleIds), eq(circleMembers.status, "accepted")))
        .groupBy(circleMembers.circleId);

      // 3.2 Fetch total contributions per circle via rounds
      const contributionResults = await db
        .select({
          circleId: roundsTable.circleId,
          total: sum(contributionsTable.amountPaid)
        })
        .from(contributionsTable)
        .innerJoin(roundsTable, eq(contributionsTable.roundId, roundsTable.id))
        .where(inArray(roundsTable.circleId, circleIds))
        .groupBy(roundsTable.circleId);
        
      userCircles = userCircles.map(circle => {
        const countObj = memberCounts.find(m => m.circleId === circle.id);
        const contribObj = contributionResults.find(c => c.circleId === circle.id);
        const totalSaved = contribObj?.total ? parseFloat(contribObj.total) : 0;
        
        return {
          ...circle,
          membersCount: countObj ? countObj.count : 0,
          totalSavedAmount: totalSaved
        };
      });
    }
  }

  // Map to dashboard item structures
  const circles = userCircles.map((circle) => ({
    id: circle.id,
    name: circle.name,
    slug: circle.slug,
    contribution: `₦${parseFloat(circle.contributionAmount).toLocaleString()}`,
    frequency: circle.frequency.charAt(0).toUpperCase() + circle.frequency.slice(1),
    members: circle.membersCount || 0,
    membersTotal: circle.maxMembers,
    contributionAmount: parseFloat(circle.contributionAmount),
    totalSaved: circle.totalSavedAmount || 0,
    nextPayout: circle.startDate ? new Date(circle.startDate).toLocaleDateString() : "TBD",
    status: circle.status === "pending" ? "Upcoming" : circle.status.charAt(0).toUpperCase() + circle.status.slice(1)
  }))

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-open-sans-custom text-foreground">My Circles</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track your active rotating pools.</p>
        </div>
        <QuickActions showCard={false} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {circles.length === 0 && (
          <GlassCard className="md:col-span-2 text-center py-16 border-dashed space-y-3">
             <div className="text-muted-foreground opacity-30 flex justify-center"><UsersIcon className="w-12 h-12" /></div>
             <p className="text-muted-foreground font-medium">No active circles found</p>
             <p className="text-muted-foreground/60 text-xs">Create your first savings pool to get started.</p>
          </GlassCard>
        )}
        {circles.map((circle) => (
          <GlassCard key={circle.id} className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-foreground">{circle.name}</h3>
                <span className="text-xs text-muted-foreground">{circle.frequency} contribution</span>
              </div>
              <span className="px-3 py-1 bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 rounded-full text-xs font-medium">
                {circle.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
              <div>
                <span className="text-muted-foreground font-medium uppercase tracking-wider">Per Round</span>
                <p className="text-sm font-bold text-foreground mt-1">{circle.contribution}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium uppercase tracking-wider">Total Pool Progress</span>
                <p className="text-sm font-bold text-[#00D4AA] mt-1">₦{circle.totalSaved.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                <span>Contribution Quota</span>
                <span>{Math.min(100, (circle.totalSaved / (circle.membersTotal * circle.contributionAmount) * 100)).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-white/5 h-2 rounded-full overflow-hidden border border-neutral-200/20 dark:border-white/5">
                <div 
                  className="bg-gradient-to-r from-[#6C3AFA] to-[#00D4AA] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(108,58,250,0.3)]" 
                  style={{ width: `${Math.min(100, (circle.totalSaved / (circle.membersTotal * circle.contributionAmount) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-white/10">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="w-3 h-3" /> Next Payout: {circle.nextPayout}
              </div>
              <Link href={`/dashboard/circles/${circle.slug || circle.id}`}>
                <Button variant="link" className="text-[#00D4AA] p-0 h-auto text-xs flex items-center gap-1 font-medium">
                  View Details <ArrowRightIcon className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>

      {pendingRequestsRaw.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-neutral-200/50 dark:border-white/10">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Requests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pendingRequestsRaw.map((req: any) => (
              <GlassCard key={req.circle.id} className="p-4 space-y-2 relative group hover:border-neutral-300 dark:hover:border-white/20 transition-all">
                <span className="absolute top-4 right-4 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200/50 dark:border-amber-500/20 rounded-full text-[10px] font-medium">Pending</span>
                <div>
                  <h3 className="font-bold text-sm text-foreground truncate max-w-[180px]">{req.circle.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ID: <span className="font-mono bg-neutral-100/80 dark:bg-white/5 px-1 rounded">{req.circle.id}</span></p>
                </div>
                <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CalendarIcon className="w-3 h-3 text-muted-foreground/60" /> 
                  Requested: {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : "Recently"}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
