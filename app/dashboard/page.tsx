import { GlassCard } from "@/components/ui/glass-card"
import { ExternalLinkIcon, PlusCircleIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { circles, contributions } from "@/lib/db/schema"
import { eq, sum, and } from "drizzle-orm"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const user = session?.user

  // Fetch real statistics
  let activeCirclesCount = "0"
  let totalSavedAmount = "₦0"
  let pendingAmount = "₦0"
  let recentActivities: any[] = []

  if (user) {
    const userCircles = await db
      .select()
      .from(circles)
      .where(eq(circles.organizerId, user.id))
    
    activeCirclesCount = userCircles.length.toString()

    const savedResult = await db
      .select({ total: sum(contributions.amountPaid) })
      .from(contributions)
      .where(and(eq(contributions.memberId, user.id), eq(contributions.paymentVerified, true)))
    
    const totalSaved = savedResult[0]?.total ? parseFloat(savedResult[0].total) : 0
    totalSavedAmount = `₦${totalSaved.toLocaleString()}`

    // Fetch actual recent activities
    const logs = await db.query.contributions.findMany({
      where: and(eq(contributions.memberId, user.id), eq(contributions.paymentVerified, true)),
      orderBy: (contributions, { desc }) => [desc(contributions.paidAt)],
      limit: 5,
      with: {
        round: {
          with: {
            circle: true
          }
        }
      }
    })

    recentActivities = logs.map(log => ({
      title: `Contribution for ${log.round?.circle?.name || 'Circle'}`,
      time: log.paidAt ? new Date(log.paidAt).toLocaleDateString() : 'Just now',
      amount: `+₦${parseFloat(log.amountPaid).toLocaleString()}`,
    }))
  }

  const stats = [
    { name: "Active Circles", value: activeCirclesCount, description: "Circles you organize" },
    { name: "Total Saved", value: totalSavedAmount, description: "All-time accumulated savings" },
    { name: "Next Payout", value: "None", description: "No active rounds yet" },
    { name: "Pending", value: "₦0", description: "No ongoing rounds" },
  ]

  const activities = recentActivities

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-open-sans-custom text-foreground">
          Good morning, {user?.name || "User"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here is the update overview of your savings groups.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <GlassCard key={stat.name}>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{stat.name}</span>
            <div className="text-2xl font-bold mt-2 text-foreground">{stat.value}</div>
            <p className="text-muted-foreground text-xs mt-1">{stat.description}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Actions Cards */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
              <Button variant="link" className="text-[#00D4AA] p-0 flex items-center gap-1 text-sm">
                View all <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {activities.length > 0 ? activities.map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-neutral-200/10 last:border-0 border-dashed">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  {activity.amount && (
                    <span className="text-sm font-bold text-[#00D4AA]">
                      {activity.amount}
                    </span>
                  )}
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No recent activity found.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions Panel */}
        <QuickActions />
      </div>
    </div>
  )
}
