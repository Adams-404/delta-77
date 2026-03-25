"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsIcon, InfoIcon, CheckIcon } from "lucide-react"
import { updateCircleAction } from "@/app/actions/circles"

export function EditCircleModal({ circle, membersCount }: { circle: any, membersCount: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(circle.pendingName || circle.name)
  const [description, setDescription] = useState(circle.description || "")
  const [amount, setAmount] = useState(circle.pendingContributionAmount || circle.contributionAmount)
  const [maxMembers, setMaxMembers] = useState(circle.maxMembers.toString())

  const isAlone = membersCount <= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await updateCircleAction(circle.id, {
        description,
        maxMembers: parseInt(maxMembers),
        name: name !== circle.name ? name : undefined,
        amount: amount !== circle.contributionAmount ? amount : undefined,
      })
      if (res.success) {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update circle")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="text-xs flex items-center gap-1.5 rounded-full border-neutral-200/80 shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6C3AFA]/10 hover:text-[#6C3AFA] hover:border-[#6C3AFA]/30"
      >
        <SettingsIcon className="w-3.5 h-3.5 transition-colors duration-300" /> Edit Circle
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200/60 dark:border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl relative animate-in zoom-in-95 duration-250">
            {success ? (
               <div className="text-center space-y-4 py-4">
                 <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mx-auto">
                     <CheckIcon className="w-6 h-6 text-green-500" />
                 </div>
                 <h3 className="font-bold text-foreground">Updated Successfully!</h3>
                 <p className="text-xs text-muted-foreground leading-relaxed">Your circle details have been updated matching current rules policies safely.</p>
                 <Button 
                   onClick={() => { 
                     setIsOpen(false); 
                     setSuccess(false); 
                   }} 
                   className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white mt-2 text-xs"
                 >
                   Ok, Thanks
                 </Button>
               </div>
            ) : (
              <>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-[#6C3AFA]" /> Edit Circle Details
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Modify your savings pool configuration layout easily.</p>
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</p>}

            {!isAlone && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-2 items-start text-amber-600 dark:text-amber-500">
                <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed font-medium">
                  Since you have other members, updating the <strong className="font-bold text-foreground">Name</strong> or <strong className="font-bold text-foreground">Contribution Amount</strong> will create a pending change request that must be approved by all members before making effect.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Circle Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Description</Label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-white/50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-md p-2 text-sm max-h-24 text-foreground focus:ring-1 focus:ring-[#6C3AFA] outline-none transition-all"
                  placeholder="Tell members what this circle is about..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Amount (₦)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Max Members</Label>
                  <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} required className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10" />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-neutral-100 dark:border-white/5">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading} className="text-xs border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white text-xs" disabled={loading}>
                  {loading ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
            </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
