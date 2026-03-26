import { Button } from "@/components/ui/button"
import { db } from "@/lib/db/client"
import { circles, circleMembers, user as userTable, rounds as roundsTable, contributions as contributionsTable } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  UsersIcon, 
  CreditCardIcon, 
  ShieldCheckIcon,
  InfoIcon,
  PlusCircleIcon
} from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CopyButton } from "@/components/dashboard/copy-button"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { approveMemberAction } from "@/app/actions/circles"
import { MemberActions } from "@/components/dashboard/member-actions"
import { CircleInfoModal } from "@/components/dashboard/circle-info-modal"
import { EditCircleModal } from "@/components/dashboard/edit-circle-modal"
import { VoteBanner } from "@/components/dashboard/vote-banner"
import { GlassCard } from "@/components/ui/glass-card"

export default async function CircleDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  const session = await auth.api.getSession({ headers: await headers() });
  const viewer = session?.user;

  if (!viewer) {
    redirect("/login");
  }

  // 1. Fetch Circle details
  const [circle] = await db
    .select()
    .from(circles)
    .where(eq(circles.slug, slug))

  if (!circle) {
    return notFound()
  }

  // 2. Check viewer membership status
  const [currentMember] = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circle.id), eq(circleMembers.userId, viewer?.id || "not-found")));

  // 3. Fetch recent contributions for this circle
  const circleRoundIds = await db.select({ id: roundsTable.id }).from(roundsTable).where(eq(roundsTable.circleId, circle.id));
  const ids = circleRoundIds.map(r => r.id);

  const recentContributions = ids.length > 0 ? await db.query.contributions.findMany({
    where: (contributions, { and, eq, inArray }) => and(
        eq(contributions.paymentVerified, true),
        inArray(contributions.roundId, ids)
    ),
    orderBy: (contributions, { desc }) => [desc(contributions.paidAt)],
    limit: 5,
    with: {
        member: true,
        round: true
    }
  }) : [];

  // If pending and not organizer, show holding screen
  if (currentMember?.status === "pending" && viewer?.id !== circle.organizerId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-transparent space-y-4">
        <GlassCard className="flex flex-col items-center justify-center p-12 max-w-xl w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <CalendarIcon className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Request Pending</h2>
          <p className="text-sm text-muted-foreground">
            Your request to join <strong className="font-semibold text-foreground">{circle.name}</strong> has been sent to the organizer. 
            Please wait for them to approve your entry.
          </p>
          <Link href="/dashboard/circles">
            <Button variant="outline" className="text-xs border-white/10 text-muted-foreground hover:text-foreground">
              <ArrowLeftIcon className="w-3 h-3 mr-1" /> Back to Dashboard
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // 3. Fetch Members of this Circle
  const members = await db
    .select({
      id: circleMembers.id,
      userId: circleMembers.userId,
      name: userTable.name,
      email: userTable.email,
      status: circleMembers.status,
      joinedAt: circleMembers.joinedAt
    })
    .from(circleMembers)
    .innerJoin(userTable, eq(circleMembers.userId, userTable.id))
    .where(eq(circleMembers.circleId, circle.id))

  const acceptedCount = members.filter(m => m.status === 'accepted').length;
  const isFull = acceptedCount === circle.maxMembers;
  const isMember = members.some(m => m.userId === viewer.id && m.status === "accepted");

  // --- Auto-Repair Status: If full but still pending, mark as active ---
  if (isFull && circle.status === "pending") {
      await db.update(circles)
          .set({ status: 'active', startDate: new Date() })
          .where(eq(circles.id, circle.id));
      // Update local circle object to reflect change in current render
      circle.status = "active";
  }

  const hasPaidCurrentRound = recentContributions.some(
    c => c.memberId === viewer.id && c.round?.roundNumber === circle.currentRound && c.paymentVerified
  );

  return (
    <div className="space-y-8 max-w-7xl w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/circles">
            <Button variant="ghost" size="icon" className="rounded-full border border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
              <ArrowLeftIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{circle.name}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1">Circle ID: <span className="font-mono bg-neutral-100 dark:bg-white/5 px-1 rounded">{circle.id}</span> <CopyButton text={circle.id} /></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewer?.id === circle.organizerId && <EditCircleModal circle={circle} membersCount={acceptedCount} />}
          <CircleInfoModal circle={circle} />
          {isMember && (
            hasPaidCurrentRound ? (
              <Link href={`/dashboard/receipt/${recentContributions.find(c => c.memberId === viewer.id)?.id}`}>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 rounded-full border-[#00D4AA]/30 bg-[#00D4AA]/5 text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-all">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> Contribution Paid
                </Button>
              </Link>
            ) : (
              <Link href={`/dashboard/circles/${slug}/payment`}>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 rounded-full border-neutral-200/80 shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6C3AFA]/10 hover:text-[#6C3AFA] hover:border-[#6C3AFA]/30">
                  <CreditCardIcon className="w-3.5 h-3.5 transition-colors duration-300" /> Make Contribution
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
      
      <VoteBanner circle={circle} viewerId={viewer?.id || ""} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Card */}
        <GlassCard className="lg:col-span-2 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Circle Details</h2>
            <span 
              title={circle.status === "pending" ? "The status will change once the savings cycle begins" : undefined}
              className="px-3 py-1 bg-teal-500/10 text-[#00D4AA] border border-[#00D4AA]/20 rounded-full text-xs font-medium uppercase cursor-help"
            >
              {circle.status === "pending" ? "Upcoming" : circle.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <CreditCardIcon className="w-3 h-3 text-[#6C3AFA]" /> Contribution
              </span>
              <p className="text-lg font-bold text-foreground mt-1">
                ₦{parseFloat(circle.contributionAmount).toLocaleString()}
              </p>
              <span className="text-xs text-muted-foreground italic">{circle.frequency} interval</span>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <UsersIcon className="w-3 h-3 text-[#00D4AA]" /> Members
              </span>
              <p className="text-lg font-bold text-[#00D4AA] mt-1">
                {acceptedCount} / {circle.maxMembers}
              </p>
              <span className={`text-xs ${isFull ? "text-[#00D4AA] font-semibold" : "text-muted-foreground"}`}>
                {isFull ? "🎉 All members onboard! Let's start Esusu" : "Target capacity"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <p className="text-sm text-muted-foreground">
              {circle.description || "No description provided for this savings circle."}
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-white/10 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Started: {circle.startDate ? new Date(circle.startDate).toLocaleDateString() : "Pending"}</span>
            <span className="flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3" /> Cycle Round: #{circle.currentRound}</span>
          </div>
        </GlassCard>

        {/* Members Sidebar List */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Members</h2>
          
          <div className="divide-y divide-neutral-100 dark:divide-white/10">
            {members.map((member) => (
              <div key={member.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{member.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {circle.organizerId === member.userId && (
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold uppercase tracking-wider">Organizer</span>
                  )}

                  {member.status !== "accepted" && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      member.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {member.status}
                    </span>
                  )}

                  {viewer?.id === circle.organizerId && member.status === "pending" && (
                    <MemberActions memberId={member.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity Summary */}
      <GlassCard className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Activity Summary</h2>
          <Link href="/dashboard/contributions">
             <Button variant="ghost" size="sm" className="text-xs text-[#6C3AFA]">View Full History</Button>
          </Link>
        </div>

        <div className="space-y-4">
            {/* Real contributions for this circle */}
            {recentContributions && recentContributions.length > 0 ? (
                <div className="space-y-4">
                    {recentContributions.map((log) => (
                        <div key={log.id} className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-[#6C3AFA]/10 flex items-center justify-center border border-[#6C3AFA]/20 group-hover:bg-[#6C3AFA]/20 transition-colors">
                                <CreditCardIcon className="w-5 h-5 text-[#6C3AFA]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                    <span className="font-bold">{log.member?.name || 'Member'}</span> made a contribution
                                </p>
                                <p className="text-xs text-muted-foreground">Successfully verified payment for Round #{log.round?.roundNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[#00D4AA]">
                                    +₦{parseFloat(log.amountPaid).toLocaleString()}
                                </p>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    {log.paidAt ? new Date(log.paidAt).toLocaleDateString() : 'Just now'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No payment activity recorded yet.</p>
                </div>
            )}
            
            {/* Circle Member Join Activity */}
            <div className="pt-4 border-t border-neutral-100 dark:border-white/10 space-y-4">
                {members.filter(m => m.status === 'accepted').slice(0, 3).map((m) => (
                    <div key={m.id} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-[#00D4AA]/10 flex items-center justify-center border border-[#00D4AA]/20 group-hover:bg-[#00D4AA]/20 transition-colors">
                            <PlusCircleIcon className="w-5 h-5 text-[#00D4AA]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                                <span className="font-bold">{m.name}</span> joined the circle
                            </p>
                            <p className="text-xs text-muted-foreground">Onboarded as an active member</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                            {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "Recently"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </GlassCard>


      {/* Guide Panel */}
      <GlassCard className="p-6 flex gap-4 max-w-4xl bg-blue-500/5 border-blue-500/10">
        <div className="text-blue-500 mt-1"><InfoIcon className="w-5 h-5" /></div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">How to populate your Circle</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share the <strong className="font-bold text-foreground">Circle ID</strong> with friends or team members so they can join using the "Join Circle" button on their dashboards. Once your circle reaches its maximum capacity of <strong className="font-bold text-foreground">{circle.maxMembers} members</strong>, periodic automatic payout rounds will trigger in proper rotational shifts securely.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
