"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match")
      setLoading(false)
      return
    }

    const { error } = await authClient.signUp.email({ 
      email, 
      password,
      name,
      phoneNumber, // custom mapped field
    } as any)

    setLoading(false)

    if (error) {
      setErrorMsg(error.message || "Registration failed")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-8 backdrop-blur-md w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-open-sans-custom text-white [text-shadow:_0_2px_10px_rgb(0_0_0_/_60%)]">
          Create Account
        </h1>
        <p className="text-gray-400 text-sm font-open-sans-custom mt-2">
          Start automating your Esusu circles today.
        </p>
        {errorMsg && (
          <p className="text-red-600 dark:text-red-400 text-xs font-open-sans-custom mt-2 bg-red-500/10 dark:bg-red-900/40 p-2 rounded-md border border-red-500/20">
            {errorMsg}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white font-open-sans-custom">Full Name</Label>
          <Input 
            type="text" 
            placeholder="John Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
        </div>

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
          <Label className="text-white font-open-sans-custom">Phone Number</Label>
          <Input 
            type="tel" 
            placeholder="+234..." 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-open-sans-custom">Password</Label>
          <PasswordInput 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white font-open-sans-custom">Confirm Password</Label>
          <PasswordInput 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
          {confirmPassword && (
            password === confirmPassword ? (
              <p className="text-[#00D4AA] text-xs font-open-sans-custom mt-1">
                Passwords match
              </p>
            ) : (
              <p className="text-red-400 text-xs font-open-sans-custom mt-1">
                Passwords do not match
              </p>
            )
          )}
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white font-open-sans-custom"
        >
          {loading ? "Signing Up..." : "Sign Up"}
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
          Already have an account?{" "}
          <Link href="/login" className="text-[#00D4AA] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
