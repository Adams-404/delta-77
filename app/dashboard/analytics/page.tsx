"use client"
import { useState, useEffect } from "react"
import { BarChartIcon, TrendingUpIcon, PieChartIcon, Loader2Icon } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
        <Loader2Icon className="w-10 h-10 text-[#6C3AFA] animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Calculating stats...</p>
      </div>
    )
  }

  // Fallback for no data
  if (!data) return null

  // Find max for bar chart scaling
  const maxTotal = data.monthlyTrends ? Math.max(...data.monthlyTrends.map((t: any) => t.total), 1) : 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-open-sans-custom text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your savings habits and circle distribution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <TrendingUpIcon className="w-4 h-4 text-[#00D4AA]" /> Avg Monthly Contribution
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">
            ₦{data.avgContribution ? data.avgContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </p>
        </GlassCard>
        
        <GlassCard>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <BarChartIcon className="w-4 h-4 text-[#6C3AFA]" /> Active Rounds Joined
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">{data.activeRoundsCount || 0}</p>
        </GlassCard>
        
        <GlassCard>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <PieChartIcon className="w-4 h-4 text-teal-500" /> Success Rate
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">{data.successRate || 100}%</p>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-lg font-bold mb-6 text-foreground">Your Contributions (Last 6 Months)</h3>
        {/* Added h-full to the column wrapper and justify-end/items-center logic to fix height calculation */}
        <div className="h-64 flex items-end justify-between gap-4 px-4 pb-4">
          {data.monthlyTrends?.map((trend: any, index: number) => {
            const height = (trend.total / maxTotal) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                {/* Fixed: Container now has h-full so percentage height works inside it */}
                <div className="w-full flex flex-col items-center justify-end h-[calc(100%-20px)]">
                  <div 
                    className="w-full max-w-[40px] bg-[#6C3AFA]/20 group-hover:bg-[#6C3AFA]/40 border border-[#6C3AFA]/30 dark:border-white/10 rounded-lg transition-all duration-500 relative"
                    style={{ height: `${Math.max(height, height > 0 ? 5 : 0)}%` }}
                  >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap pointer-events-none z-10">
                          ₦{trend.total.toLocaleString()}
                      </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">{trend.month}</span>
              </div>
            );
          })}
        </div>
        
        {data.monthlyTrends && data.monthlyTrends.every((t: any) => t.total === 0) && (
             <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40 italic text-sm border-t border-neutral-100 dark:border-white/5 mt-4">
                <BarChartIcon className="w-8 h-8 opacity-20 mb-2" />
                No contribution history found for the last 6 months.
             </div>
        )}
      </GlassCard>
    </div>
  )
}
