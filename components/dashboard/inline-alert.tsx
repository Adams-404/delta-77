import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineAlertProps {
  type?: "error" | "success" | "info"
  message: string
  onClose?: () => void
  className?: string
}

export function InlineAlert({ type = "info", message, onClose, className }: InlineAlertProps) {
  const styles = {
    error: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
    success: "bg-[#00D4AA]/10 border-[#00D4AA]/20 text-teal-600 dark:text-[#00D4AA]",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
  }

  const icons = {
    error: <AlertCircleIcon className="w-4 h-4" />,
    success: <CheckCircle2Icon className="w-4 h-4" />,
    info: <InfoIcon className="w-4 h-4" />
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300",
      styles[type],
      className
    )}>
      <div className="shrink-0">
        {icons[type]}
      </div>
      <p className="flex-1 leading-relaxed">{message}</p>
      {onClose && (
        <button 
          onClick={onClose}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <XIcon className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
