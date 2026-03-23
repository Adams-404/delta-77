"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    const { error } = await authClient.forgetPassword({
      email,
      redirectTo: "/reset-password",
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message || "Something went wrong")
    } else {
      setSuccessMsg("If an account exists with that email, we've sent a reset link.")
    }
  }

  return (
    <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-8 backdrop-blur-md w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-open-sans-custom text-white [text-shadow:_0_2px_10px_rgb(0_0_0_/_60%)]">
          Reset Password
        </h1>
        <p className="text-gray-400 text-sm font-open-sans-custom mt-2">
          Enter your email and we'll send you a link to reset your password.
        </p>
        {errorMsg && (
          <p className="text-red-400 text-xs font-open-sans-custom mt-2 bg-red-900/40 p-2 rounded-md">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="text-[#00D4AA] text-xs font-open-sans-custom mt-2 bg-teal-900/40 p-2 rounded-md">
            {successMsg}
          </p>
        )}
      </div>

      {!successMsg ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white font-open-sans-custom">Email Address</Label>
            <Input 
              type="email" 
              placeholder="email@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-open-sans-custom"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center mt-4">
            <Link href="/login" className="text-xs text-gray-400 hover:text-white">
              Back to Login
            </Link>
          </div>
        </form>
      ) : (
        <div className="text-center mt-6">
          <Button 
            asChild
            className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-open-sans-custom"
          >
            <Link href="/login">Return to Login</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
