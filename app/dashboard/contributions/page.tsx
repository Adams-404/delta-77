import { SearchIcon, FilterIcon, ArrowUpRightIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui/glass-card"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { contributions, rounds, circles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { cn } from "@/lib/utils"

export default async function ContributionsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const user = session?.user

  let contributionLogs: any[] = []

  if (user) {
    contributionLogs = await db
      .select({
        id: contributions.id,
        circleName: circles.name,
        amount: contributions.amountPaid,
        date: contributions.paidAt,
        verified: contributions.paymentVerified
      })
      .from(contributions)
      .innerJoin(rounds, eq(contributions.roundId, rounds.id))
      .innerJoin(circles, eq(rounds.circleId, circles.id))
      .where(eq(contributions.memberId, user.id))
  }

  const history = contributionLogs.map((log) => ({
    id: log.id,
    circle: log.circleName,
    amount: `₦${parseFloat(log.amount).toLocaleString()}`,
    date: log.date ? new Date(log.date).toLocaleDateString() : "Pending",
    type: "Contribution", // Can extend default enum
    status: log.verified ? "Success" : "Pending"
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-open-sans-custom text-foreground">Contributions History</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all your incoming and outgoing transactions.</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input placeholder="Search logs..." className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground pl-10" />
        </div>
        <Button variant="outline" className="border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center gap-2 shadow-sm">
          <FilterIcon className="w-4 h-4" /> Filter
        </Button>
      </div>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200/60 dark:border-white/10">
              <th className="p-6 pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Circle</th>
              <th className="p-6 pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="p-6 pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="p-6 pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="p-6 pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="p-6 pb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right whitespace-nowrap">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm italic opacity-60">
                  No contributions or payouts logged yet.
                </td>
              </tr>
            )}
            {history.map((log) => (
              <tr key={log.id} className="border-b border-neutral-100 dark:border-white/5 last:border-0 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                <td className="p-6 py-4 text-sm font-medium text-foreground">{log.circle}</td>
                <td className={cn("p-6 py-4 text-sm font-bold", log.type === "Payout" ? "text-[#00D4AA]" : "text-foreground")}>
                  {log.amount}
                </td>
                <td className="p-6 py-4 text-sm text-muted-foreground">{log.date}</td>
                <td className="p-6 py-4 text-sm text-muted-foreground">{log.type}</td>
                <td className="p-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 rounded-md text-xs font-medium">
                    {log.status}
                  </span>
                </td>
                <td className="p-6 py-4 text-right">
                   <Link href={`/dashboard/receipt/${log.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-[#6C3AFA] hover:text-[#5B30D9] hover:bg-purple-500/5 h-8">
                        View Receipt
                      </Button>
                   </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
