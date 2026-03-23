import { cn } from "@/lib/utils"
import { Users, CreditCard, Zap } from "lucide-react"

const steps = [
  {
    number: "1",
    title: "Create your circle",
    description: "Set the amount, frequency (weekly/monthly), and invite members via WhatsApp.",
    icon: Users,
  },
  {
    number: "2",
    title: "Everyone contributes",
    description: "The AI bot reminds everyone before deadlines and verifies contributions automatically.",
    icon: CreditCard,
  },
  {
    number: "3",
    title: "Automatic Payouts",
    description: "When the round ends, the pot is sent to the next person automatically with zero manual effort.",
    icon: Zap,
  },
]

export function HowItWorks() {
  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 py-20 flex-col items-center text-center">
          <div className="flex gap-2 flex-col max-w-xl">
            <h2 className="text-3xl md:text-5xl tracking-tighter font-open-sans-custom text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
              How It Works
            </h2>
            <p className="text-lg text-gray-300 font-open-sans-custom [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
              Three simple steps to automate your community savings.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 w-full max-w-4xl">
            {steps.map((step) => (
              <div 
                key={step.number}
                className={cn(
                  "bg-white/5 border-2 border-white/10 rounded-2xl p-6 backdrop-blur-sm",
                  "flex flex-col items-center text-center gap-4 hover:border-white/20 transition-all cursor-pointer"
                )}
              >
                <div className="p-3 bg-white/10 rounded-full">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#6C3AFA] to-[#00D4AA] text-white font-bold text-sm">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-white font-open-sans-custom">
                  {step.title}
                </h3>
                <p className="text-gray-300 text-sm font-open-sans-custom">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
