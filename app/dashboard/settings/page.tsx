"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { GlassCard } from "@/components/ui/glass-card"
import { PasswordInput } from "@/components/ui/password-input"

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user

  const [name, setName] = useState("")

  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bvn, setBvn] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone((user as any).phoneNumber || "")
    }
  }, [user])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match")
      return
    }

    setUpdateLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    const { error } = await authClient.changePassword({
      newPassword: newPassword,
      currentPassword: currentPassword,
      revokeOtherSessions: true,
    })

    setUpdateLoading(false)

    if (error) {
      setErrorMsg(error.message || "Failed to update password")
    } else {
      setSuccessMsg("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold font-open-sans-custom text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your security settings.</p>
      </div>

      {/* Profile Section - Read Only */}
      <GlassCard className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Profile Information</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Full Name</Label>
              <Input
                value={name}
                className="bg-neutral-50/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Phone Number</Label>
              <Input
                value={phone}
                className="bg-neutral-50/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Email</Label>
            <Input
              type="email"
              value={email}
              className="bg-neutral-50/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">BVN (Bank Verification Number)</Label>
            <Input
              value={bvn}
              placeholder="Verified"
              className="bg-neutral-50/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium italic opacity-70">Contact support to change your verified profile details.</p>
        </div>
      </GlassCard>

      {/* Security Section - Update Password */}
      <GlassCard className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Security</h2>
          <p className="text-muted-foreground text-sm">Update your password to keep your account secure.</p>
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm bg-red-50/50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20 font-medium">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="text-[#00D4AA] text-sm bg-teal-50/50 dark:bg-[#00D4AA]/10 p-3 rounded-lg border border-teal-100 dark:border-[#00D4AA]/20 font-medium">
            {successMsg}
          </p>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Current Password</Label>
            <PasswordInput
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">New Password</Label>
            <PasswordInput
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Confirm New Password</Label>
            <PasswordInput
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-foreground"
              required
            />
            {confirmPassword && (
              newPassword === confirmPassword ? (
                <p className="text-[#00D4AA] text-xs font-medium mt-1">
                  Passwords match
                </p>
              ) : (
                <p className="text-red-500 text-xs font-medium mt-1">
                  Passwords do not match
                </p>
              )
            )}
          </div>

          <Button
            type="submit"
            disabled={updateLoading}
            className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white px-8 transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          >
            {updateLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
