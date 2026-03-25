"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const { error } = await authClient.signIn.email({ 
      email, 
      password 
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message || "Invalid credentials")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-8 backdrop-blur-md w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-open-sans-custom text-white [text-shadow:_0_2px_10px_rgb(0_0_0_/_60%)]">
          Welcome Back
        </h1>
        <p className="text-gray-400 text-sm font-open-sans-custom mt-2">
          Log in to manage your savings circles.
        </p>
        {errorMsg && (
          <p className="text-red-600 dark:text-red-400 text-xs font-open-sans-custom mt-2 bg-red-500/10 dark:bg-red-900/40 p-2 rounded-md border border-red-500/20">
            {errorMsg}
          </p>
        )}
      </div>

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

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-white font-open-sans-custom">Password</Label>
            <Link href="/forgot-password" className="text-xs text-[#00D4AA] hover:underline">
              Forgot?
            </Link>
          </div>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-open-sans-custom"
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 font-open-sans-custom">
          Google
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-400 text-sm">
          Are you new here?{" "}
          <Link href="/register" className="text-[#00D4AA] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
