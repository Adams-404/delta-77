"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { PlusCircleIcon, ExternalLinkIcon, CheckIcon } from "lucide-react"
import { createCircleAction, joinCircleAction, getCircleInfoAction } from "@/app/actions/circles"

export function QuickActions({ showCard = true }: { showCard?: boolean }) {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Create States
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState("weekly")
  const [maxMembers, setMaxMembers] = useState("5")

  // Join States
  const [circleId, setCircleId] = useState("")
  const [searching, setSearching] = useState(false)
  const [circleInfo, setCircleInfo] = useState<any>(null)
  const [joinSuccess, setJoinSuccess] = useState(false)

  const handleSearchCircle = async (id: string) => {
    setCircleId(id)
    if (id.trim().length === 0) {
      setCircleInfo(null)
      return
    }
    setSearching(true)
    try {
      const res = await getCircleInfoAction(id)
      if (res.found) {
        setCircleInfo(res)
      } else {
        setCircleInfo(null)
      }
    } catch (err) {
      setCircleInfo(null)
    } finally {
      setSearching(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await createCircleAction({
        name,
        description,
        amount,
        frequency,
        maxMembers: parseInt(maxMembers)
      })
      if (res.success) {
        alert(`Circle created successfully! ID: ${res.circleId}`)
        setShowCreate(false)
        setName("")
        setDescription("")
        setAmount("")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create circle")
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await joinCircleAction(circleId)
      if (res.success) {
        setJoinSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || "Failed to join circle")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {showCard ? (
        <GlassCard>
          <h2 className="text-lg font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="space-y-3">
            <Button 
              onClick={() => setShowCreate(true)} 
              className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
            >
              <PlusCircleIcon className="w-4 h-4" /> Create Circle
            </Button>
            <Button 
              onClick={() => setShowJoin(true)} 
              variant="outline" 
              className="w-full border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ExternalLinkIcon className="w-4 h-4" /> Join Circle
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreate(true)} 
            className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white flex items-center justify-center gap-2 px-3 py-1.5 h-auto text-xs shadow-lg shadow-purple-500/20"
          >
            <PlusCircleIcon className="w-3.5 h-3.5" /> Create Circle
          </Button>
          <Button 
            onClick={() => setShowJoin(true)} 
            variant="outline" 
            className="border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center gap-2 px-3 py-1.5 h-auto text-xs"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" /> Join Circle
          </Button>
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0A0910] border-2 border-neutral-200/60 dark:border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl mx-4">
            <h2 className="text-lg font-bold text-foreground">Create Circle</h2>
            {error && <p className="text-red-500 text-xs bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-100 dark:border-red-500/20">{error}</p>}
            
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="E.g., Dev Team Contribution" className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground" />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g., Savings pool for our devs" className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount (₦)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="5000" className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Max Members</Label>
                  <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} required placeholder="10" className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Frequency</Label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-white/50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-[#6C3AFA] focus:outline-none">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={loading} className="border-neutral-200 dark:border-white/10 text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white shadow-lg shadow-purple-500/20" disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Circle Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0A0910] border-2 border-neutral-200/60 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl mx-4">
            {joinSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-[#00D4AA]/10 flex items-center justify-center border border-teal-200 dark:border-[#00D4AA]/20 mx-auto">
                    <CheckIcon className="w-6 h-6 text-[#00D4AA]" />
                </div>
                <h3 className="font-bold text-foreground">Request Sent!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Your application to join the circle has been sent to the organizer. Waiting for approval.</p>
                <Button 
                  onClick={() => { 
                    setShowJoin(false); 
                    setJoinSuccess(false); 
                    setCircleId(""); 
                    setCircleInfo(null); 
                  }} 
                  className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white mt-2 shadow-lg shadow-purple-500/20"
                >
                  Got it
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground">Join Circle</h2>
                {error && <p className="text-red-500 text-xs bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-100 dark:border-red-500/20">{error}</p>}
                
                <form onSubmit={handleJoin} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Circle ID / Code</Label>
                    <Input value={circleId} onChange={(e) => handleSearchCircle(e.target.value)} required placeholder="E.g., 9X6Y3Z" className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground uppercase" />
                  </div>

                  {searching && <p className="text-xs text-muted-foreground animate-pulse">Searching...</p>}

                  {circleInfo && (
                    <div className="p-3 bg-neutral-50/50 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 space-y-1">
                      {circleInfo.found ? (
                        <>
                          <p className="font-semibold text-sm text-foreground">{circleInfo.circle.name}</p>
                          {circleInfo.isMember && (
                            <p className="text-red-500 font-medium text-xs flex items-center gap-1 mt-1">
                              Already member of this circle!
                            </p>
                          )}
                          {circleInfo.isPending && (
                            <p className="text-amber-500 font-medium text-xs flex items-center gap-1 mt-1">
                              Your request is pending Approval.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-red-500">Circle not found.</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => { setShowJoin(false); setCircleInfo(null); setCircleId(""); setError(""); }} disabled={loading} className="border-neutral-200 dark:border-white/10 text-muted-foreground hover:text-foreground">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white shadow-lg shadow-purple-500/20" 
                      disabled={loading || searching || (circleInfo && (!circleInfo.found || circleInfo.isMember || circleInfo.isPending)) || !circleId}
                    >
                      {loading ? "Joining..." : "Join"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
         </div>
       )}
    </div>
  )
}
