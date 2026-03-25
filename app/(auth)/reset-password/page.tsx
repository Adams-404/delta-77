"use client"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match")
      return
    }

    setLoading(true)
    setErrorMsg("")

    const { error } = await authClient.resetPassword({
      newPassword: password,
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message || "Failed to reset password")
    } else {
      router.push("/login?message=Password reset successful")
    }
  }

  return (
    <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-8 backdrop-blur-md w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-open-sans-custom text-white [text-shadow:_0_2px_10px_rgb(0_0_0_/_60%)]">
          Set New Password
        </h1>
        <p className="text-gray-400 text-sm font-open-sans-custom mt-2">
          Please enter and confirm your new password.
        </p>
        {errorMsg && (
          <p className="text-red-600 dark:text-red-400 text-xs font-open-sans-custom mt-2 bg-red-500/10 dark:bg-red-900/40 p-2 rounded-md border border-red-500/20">
            {errorMsg}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white font-open-sans-custom">New Password</Label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-open-sans-custom">Confirm New Password</Label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-open-sans-custom"
        >
          {loading ? "Resetting..." : "Update Password"}
        </Button>

        <div className="text-center mt-4">
          <Link href="/login" className="text-xs text-gray-400 hover:text-white">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
