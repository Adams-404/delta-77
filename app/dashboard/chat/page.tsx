"use client"
import { useState, useRef, useEffect } from "react"
import { SendIcon, BotIcon, Sparkles, History, ArrowUpRight, Loader2, User, Info, Plus, CreditCardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
  createdAt: string
}

const SUGGESTIONS = [
  "How much have I saved?",
  "Create a new circle",
  "Who is next for payout?",
  "Check my contributions"
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/chat/history")
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
        }
      } catch (err) {
        console.error("Failed to fetch chat history", err)
      } finally {
        setIsFetching(false)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages, isLoading])

  const handleSend = async (text?: string) => {
    const messageContent = text || input
    if (!messageContent.trim() || isLoading) return

    const userMsg: Message = {
      role: "user",
      content: messageContent,
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageContent })
      })

      if (!res.ok) throw new Error("Failed to send message")

      const data = await res.json()
      const botMsg: Message = {
        role: "assistant",
        content: data.response,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      toast.error("AI Assistant is having trouble. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full max-w-4xl mx-auto flex flex-col relative pb-4 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#6C3AFA]/10 to-transparent pointer-events-none opacity-50 blur-[100px]" />

      {/* Header Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md rounded-t-3xl z-30"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6C3AFA] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BotIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">EsuX AI Agent</h2>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[10px] text-muted-foreground font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button 
             variant="ghost" 
             size="icon" 
             className="text-muted-foreground hover:text-white rounded-xl hover:bg-white/5"
             onClick={async () => {
               if (!confirm("Are you sure you want to clear your chat history?")) return;
               try {
                 const res = await fetch("/api/chat/history", { method: "DELETE" });
                 if (res.ok) {
                   setMessages([]);
                   toast.success("Chat history cleared!");
                 }
               } catch (err) {
                 toast.error("Failed to clear history.");
               }
             }}
           >
             <Plus className="w-4 h-4" />
           </Button>
           <Button 
             variant="ghost" 
             size="icon" 
             className="text-muted-foreground hover:text-white rounded-xl hover:bg-white/5"
             onClick={async () => {
                setIsFetching(true);
                try {
                  const res = await fetch("/api/chat/history");
                  if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                    toast.success("History refreshed!");
                  }
                } catch (err) {
                  toast.error("Failed to load history.");
                } finally {
                  setIsFetching(false);
                }
             }}
           >
             <History className="w-4 h-4" />
           </Button>
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white rounded-xl hover:bg-white/5">
             <Info className="w-4 h-4" />
           </Button>
        </div>
      </motion.div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-neutral-900/20 border-x border-white/5 relative z-10">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 scroll-smooth custom-scrollbar"
        >
          {isFetching ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40">
              <Loader2 className="w-8 h-8 animate-spin text-[#6C3AFA]" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase">Initializing Brain</p>
            </div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-10"
            >
              <div className="space-y-4 max-w-sm">
                <Sparkles className="w-10 h-10 text-[#6C3AFA] mx-auto animate-pulse" />
                <h3 className="font-extrabold text-3xl text-white tracking-tight">Your Ajo circle, just a message away.</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed px-4">
                  Manage contributions, track payouts, and coordinate with members using natural language.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="group flex flex-col items-start p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#6C3AFA]/50 hover:bg-[#6C3AFA]/5 transition-all text-left cursor-pointer active:scale-95"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-bold text-[#6C3AFA] tracking-[0.1em] uppercase opacity-70">Query Idea</span>
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-[#6C3AFA] transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-white/90 group-hover:text-white">{s}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto w-full pb-8">
              {messages.map((msg, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex w-full gap-4",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                   {/* Avatar Placeholder */}
                   <div className={cn(
                     "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                     msg.role === "user" ? "bg-[#00D4AA]/20 text-[#00D4AA]" : "bg-[#6C3AFA]/20 text-[#6C3AFA]"
                   )}>
                     {msg.role === "user" ? <User className="w-4 h-4" /> : <BotIcon className="w-4 h-4" />}
                   </div>

                    <div className={cn(
                      "max-w-[85%] md:max-w-[70%] space-y-2",
                      msg.role === "user" ? "text-right" : "text-left"
                    )}>
                       <div className={cn(
                         "inline-block px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed transition-all shadow-sm",
                         msg.role === "user" 
                           ? "bg-[#6C3AFA] text-white rounded-tr-sm shadow-purple-900/10" 
                           : "bg-white/[0.07] border border-white/10 text-white rounded-tl-sm"
                       )}>
                         <div className="space-y-1">
                           {msg.content.split("[ACTION:")[0].split("\n").map((line, i) => {
                              if (!line.trim()) return <div key={i} className="h-2" />;
                              // Handle basic bold formatting
                              const parts = line.split(/(\*\*.*?\*\*)/g);
                              return (
                                <div key={i} className="leading-relaxed">
                                  {parts.map((p, j) => {
                                    if (p.startsWith("**") && p.endsWith("**")) {
                                      return <strong key={j} className="text-white font-extrabold drop-shadow-sm">{p.slice(2, -2)}</strong>;
                                    }
                                    
                                    // Detect dashboard links
                                    if (p.includes("/dashboard/")) {
                                       const linkParts = p.split(/(\/dashboard\/[a-zA-Z0-9\-\/]+)/g);
                                       return linkParts.map((lp, k) => {
                                         if (lp.startsWith("/dashboard/")) {
                                           return (
                                             <Link 
                                               key={k} 
                                               href={lp} 
                                               className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#6C3AFA]/20 border border-[#6C3AFA]/40 rounded-lg text-[11px] font-bold text-[#A78BFA] hover:bg-[#6C3AFA]/30 transition-colors mx-1 active:scale-95 align-middle"
                                             >
                                               Visit Circle <ArrowUpRight className="w-2.5 h-2.5" />
                                             </Link>
                                           );
                                         }
                                         return lp;
                                       });
                                    }
                                    return p;
                                  })}
                                </div>
                              );
                           })}
                         </div>
                       </div>

                      {/* Special Action UI: Create Circle Form */}
                      {msg.role === "assistant" && msg.content.includes("CREATE_CIRCLE_FORM") && (
                        <div className="mt-4 p-5 rounded-3xl bg-neutral-800/80 border border-white/5 space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="w-4 h-4 text-purple-400" />
                             <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Magic Circle Setup</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Circle Name</label>
                              <Input placeholder="Esusu Squad" className="bg-white/5 border-none h-10 rounded-xl" id="form-name" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Amount (₦)</label>
                              <Input type="number" placeholder="5000" className="bg-white/5 border-none h-10 rounded-xl" id="form-amount" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Frequency</label>
                              <select className="flex h-10 w-full rounded-xl border-none bg-white/5 px-3 py-2 text-sm text-white" id="form-frequency">
                                <option value="weekly" className="bg-neutral-900">Weekly</option>
                                <option value="monthly" className="bg-neutral-900">Monthly</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Max Members</label>
                              <Input type="number" placeholder="10" className="bg-white/5 border-none h-10 rounded-xl" id="form-max" />
                            </div>
                          </div>
                          <Button 
                            className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl"
                            onClick={() => {
                              const nameValue = (document.getElementById('form-name') as HTMLInputElement).value;
                              const amountValue = (document.getElementById('form-amount') as HTMLInputElement).value;
                              const freqValue = (document.getElementById('form-frequency') as HTMLSelectElement).value;
                              const maxValue = (document.getElementById('form-max') as HTMLInputElement).value;
                              
                              if (!nameValue || !amountValue || !maxValue) {
                                toast.error("Please fill in all the details first!");
                                return;
                              }
                              
                              if (parseInt(maxValue) < 1) {
                                toast.error("Max members must be at least 1.");
                                return;
                              }

                              handleSend(`Create a circle named "${nameValue}" with ₦${amountValue} ${freqValue} contribution for up to ${maxValue} people.`);
                            }}
                          >
                            Generate Circle ✨
                          </Button>
                        </div>
                      )}

                      {/* Special Action UI: Contribution Controls */}
                      {msg.role === "assistant" && msg.content.includes("CONTRIBUTION_CONTROLS") && (
                        <div className="mt-4 p-5 rounded-3xl bg-neutral-800/80 border border-white/5 space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-2 mb-2">
                             <CreditCardIcon className="w-4 h-4 text-emerald-400" />
                             <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Contribution Hub</span>
                          </div>
                          
                          {(() => {
                             const actionTag = msg.content.match(/\[ACTION: CONTRIBUTION_CONTROLS: (.*?)\]/)?.[1] || "";
                             const params = Object.fromEntries(actionTag.split('; ').map(p => p.split('=')));
                             const hasPaid = params.hasPaid === 'true';

                             return (
                               <div className="space-y-4">
                                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="space-y-0.5">
                                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Current Status</p>
                                      <p className={cn("text-sm font-black", hasPaid ? "text-emerald-400" : "text-amber-400")}>
                                        {hasPaid ? "✓ PAID & VERIFIED" : "! PAYMENT DUE"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Amount</p>
                                      <p className="text-sm font-black text-white">₦{params.amount || "---"}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    {hasPaid ? (
                                      <Link href={`/dashboard/receipt/${params.contributionId}`} className="w-full">
                                        <Button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10">
                                          View Official Receipt 📄
                                        </Button>
                                      </Link>
                                    ) : (
                                      <>
                                        <Link href={`/dashboard/circles/${params.slug}/payment`} className="w-full">
                                          <Button className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-bold rounded-xl shadow-lg shadow-purple-500/20">
                                            Make Contribution Now ₦
                                          </Button>
                                        </Link>
                                        <Button 
                                          variant="outline" 
                                          className="w-full border-white/10 text-white/60 hover:text-white rounded-xl hover:bg-white/5"
                                          onClick={() => handleSend(`Verify my payment for the circle ${params.slug}`)}
                                        >
                                          Verify My Payment ⚡
                                        </Button>
                                      </>
                                    )}
                                  </div>
                               </div>
                             );
                          })()}
                        </div>
                      )}

                      <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#6C3AFA]/20 text-[#6C3AFA] shrink-0 flex items-center justify-center">
                    <BotIcon className="w-4 h-4" />
                  </div>
                  <div className="bg-white/[0.05] px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#6C3AFA] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#6C3AFA] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#6C3AFA] rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Bar Section */}
      <div className="px-4 py-4 md:py-6 bg-neutral-900/60 backdrop-blur-3xl border-x border-b border-white/5 rounded-b-3xl z-40 relative">
        <div className="max-w-3xl mx-auto flex items-end gap-3 relative">
          <div className="flex-1 relative bg-white/[0.03] border-2 border-white/5 rounded-2xl focus-within:border-[#6C3AFA]/40 transition-all px-4 py-2 flex items-end min-h-[56px] group">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me something about your circles..."
              className="w-full bg-transparent border-none text-white text-[15px] resize-none py-2 focus:ring-0 placeholder:text-muted-foreground/40 flex-1 custom-scrollbar max-h-40"
              style={{ height: 'auto' }}
            />
            <div className="pb-1.5 pr-1">
              <Sparkles className="w-4 h-4 text-[#6C3AFA] opacity-30 group-focus-within:opacity-100 group-focus-within:animate-pulse transition-opacity" />
            </div>
          </div>
          
          <Button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 bg-[#6C3AFA] hover:bg-[#5B30D9] text-white rounded-2xl shadow-xl shadow-purple-500/10 active:scale-95 transition-all group shrink-0 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </Button>
        </div>
        
        <div className="flex justify-center gap-6 mt-4">
           {["Privacy Secured", "End-to-End Analytics", "Smart Payouts"].map((tag, i) => (
             <div key={i} className="flex items-center gap-1.5 opacity-30">
               <div className="w-1 h-1 bg-[#00D4AA] rounded-full" />
               <span className="text-[9px] font-bold text-white uppercase tracking-wider">{tag}</span>
             </div>
           ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}
