"use client"
import { BarChartIcon, TrendingUpIcon, PieChartIcon } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export default function AnalyticsPage() {
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
          <p className="text-2xl font-bold mt-2 text-foreground">₦22,500</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <BarChartIcon className="w-4 h-4 text-[#6C3AFA]" /> Active Rounds Joined
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">4</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <PieChartIcon className="w-4 h-4 text-teal-500" /> Success Rate
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">100%</p>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-lg font-bold mb-6 text-foreground">Total Contributions Over Time</h3>
        <div className="h-64 flex items-end justify-between gap-4 px-4">
          {[40, 60, 45, 80, 55, 90, 100].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-[#6C3AFA]/20 hover:bg-[#6C3AFA]/40 border border-[#6C3AFA]/30 dark:border-white/10 rounded-lg transition-all"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-muted-foreground">{index + 1}M</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
