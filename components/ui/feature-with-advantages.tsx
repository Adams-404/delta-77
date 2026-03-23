import { Badge } from "@/components/ui/badge"
import { ShieldCheck, MessageSquare, BarChart3, Bell, RefreshCw, Globe } from "lucide-react"

function Feature() {
  return (
    <div className="w-full py-20 lg:py-0">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 py-20 flex-col items-start lg:py-0">
          <div>
            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">Platform</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-open-sans-custom text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
              Our Key Features
            </h2>
            <p className="text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-gray-300 font-open-sans-custom [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
              Discover the powerful features that make our platform the best choice for your group savings.
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="flex flex-row gap-6 w-full items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="p-3 bg-white/10 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold font-open-sans-custom">BVN-Verified Members</p>
                  <p className="text-gray-300 text-sm font-open-sans-custom">
                    No ghost contributors. Every member is verified to ensure trust.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-6 items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="p-3 bg-white/10 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold font-open-sans-custom">WhatsApp Native</p>
                  <p className="text-gray-300 text-sm font-open-sans-custom">
                    Works without an app. Manage your savings circle where you already chat.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-6 items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="p-3 bg-white/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold font-open-sans-custom">Live Dashboard</p>
                  <p className="text-gray-300 text-sm font-open-sans-custom">
                    Track every contribution in real-time with beautiful analytics.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-6 w-full items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold font-open-sans-custom">Smart Reminders</p>
                  <p className="text-gray-300 text-sm font-open-sans-custom">
                    Never miss a deadline. Automated reminders keep everyone on track.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-6 items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="p-3 bg-white/10 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold font-open-sans-custom">Automatic Payouts</p>
                  <p className="text-gray-300 text-sm font-open-sans-custom">
                    Zero manual work. Funds are automatically disbursed to the next recipient.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-6 items-start bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold font-open-sans-custom">Built for Nigeria</p>
                  <p className="text-gray-300 text-sm font-open-sans-custom">
                    Tailored for local savings traditions and supports all Nigerian banks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Feature }
