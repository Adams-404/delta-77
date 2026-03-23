import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "solid" | "translucent"
}

export function GlassCard({ children, className, variant = "translucent", ...props }: GlassCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl p-6 transition-all duration-300 relative overflow-hidden",
        "border border-white/40 dark:border-white/10 shadow-sm",
        variant === "translucent" 
          ? "bg-white/60 dark:bg-white/5 backdrop-blur-md" 
          : "bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-white/5 shadow-xs",
        className
      )}
      {...props}
    >
      {/* Liquid core reflection glass effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
