"use client"
import { useState } from "react"
import { ShieldCheckIcon, Loader2Icon, AlertCircleIcon, CheckCircle2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function KYCPage() {
  const [bvn, setBvn] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bvn.length !== 11) {
      setError("BVN must be exactly 11 digits")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/kyc/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bvn }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Verification failed")
      }

      setSuccess(true)
      // Refresh session to update bvnVerified status
      await authClient.getSession()
      
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <CheckCircle2Icon className="w-10 h-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Verification Successful!</h1>
          <p className="text-muted-foreground">Your identity has been verified. Redirecting you to the dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground font-open-sans-custom">Secure KYC Verification</h1>
        <p className="text-muted-foreground">To ensure a secure savings environment, we verify all members using their Bank Verification Number (BVN).</p>
      </div>

      <GlassCard className="p-8 space-y-6">
        <div className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <ShieldCheckIcon className="w-6 h-6 text-[#6C3AFA]" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Your BVN is used solely for identity verification via <span className="text-foreground font-semibold">Interswitch</span>. We do not store your BVN or have access to your bank accounts.
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bvn" className="text-sm font-medium text-foreground">Bank Verification Number (BVN)</Label>
            <Input 
              id="bvn"
              type="text"
              placeholder="e.g. 22233344455"
              maxLength={11}
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-lg tracking-[0.2em] font-mono h-14 text-center"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
              <AlertCircleIcon className="w-4 h-4" /> {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading || bvn.length !== 11}
            className="w-full h-12 bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-bold transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> Verifying...
              </>
            ) : (
              "Complete Verification"
            )}
          </Button>
        </form>

        <p className="text-[10px] text-center text-muted-foreground/60">
          Powered by Interswitch Real-time Verification Engine
        </p>
      </GlassCard>
    </div>
  )
}
