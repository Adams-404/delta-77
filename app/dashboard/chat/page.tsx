"use client"
import { SendIcon, BotIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui/glass-card"

export default function ChatPage() {
  const messages = [
    { sender: "bot", text: "Hello! I am your AI savings bot. How can I help you manage your circle today?", time: "12:00 PM" },
    { sender: "user", text: "How much did I contribute to Dev Team Pool last week?", time: "12:01 PM" },
    { sender: "bot", text: "You contributed ₦5,000 on Nov 20 to the Dev Team Pool.", time: "12:01 PM" },
  ]

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-open-sans-custom text-foreground">Chat with AI</h1>
        <p className="text-muted-foreground text-sm mt-1">Ask questions or configure circles using our conversational bot.</p>
      </div>

      <GlassCard className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 p-6 pr-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl max-w-xl",
                msg.sender === "user" 
                  ? "bg-[#6C3AFA]/10 dark:bg-[#6C3AFA]/20 border border-[#6C3AFA]/10 ml-auto" 
                  : "bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10"
              )}
            >
              {msg.sender === "bot" && (
                <div className="p-2 bg-[#6C3AFA]/10 dark:bg-[#6C3AFA]/20 rounded-lg">
                  <BotIcon className="w-5 h-5 text-[#6C3AFA]" />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-foreground">{msg.text}</p>
                <span className="text-xs text-muted-foreground">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-6 pt-4 border-t border-neutral-100 dark:border-white/10 flex gap-2">
          <Input placeholder="Type message or instruction..." className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground flex-1" />
          <Button className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white p-3 shadow-lg shadow-purple-500/20">
            <SendIcon className="w-4 h-4" />
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

import { cn } from "@/lib/utils"
