"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { 
  HomeIcon, 
  UsersIcon, 
  CreditCardIcon, 
  BarChartIcon, 
  SettingsIcon, 
  MessageSquareIcon,
  LogOutIcon,
  MenuIcon,
  XIcon
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const menuItems = [
  { name: "Overview", href: "/dashboard", icon: HomeIcon },
  { name: "My Circles", href: "/dashboard/circles", icon: UsersIcon },
  { name: "Contributions", href: "/dashboard/contributions", icon: CreditCardIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChartIcon },
  { name: "Chat with AI", href: "/dashboard/chat", icon: MessageSquareIcon },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [showLogout, setShowLogout] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  // Mandatory KYC Check
  const isKycPage = pathname === "/dashboard/kyc"
  const isSettingsPage = pathname === "/dashboard/settings"
  
  // Custom hook to get user data with BVN status
  const [userWithBVN, setUserWithBVN] = useState<any>(null)
  const [loadingUserData, setLoadingUserData] = useState(true)
  
  useEffect(() => {
    // If session is definitively gone (not pending and no session), redirect
    if (!isSessionPending && !session) {
      router.push("/login")
      return
    }

    const fetchUserData = async () => {
      // Wait a bit for session to be available
      if (!session?.user?.id) {
        setTimeout(() => setLoadingUserData(false), 1000)
        return
      }
      
      try {
        const res = await fetch('/api/kyc/user-status', {
          credentials: 'include'
        })
        
        if (res.ok) {
          const data = await res.json()
          setUserWithBVN(data)
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      } finally {
        setLoadingUserData(false)
      }
    }
    
    fetchUserData()
  }, [session?.user?.id])
  
  // Get BVN verification status from fetched user data
  const bvnVerified = userWithBVN?.bvnVerified || false
  
  // Only redirect if we're not loading, we have successfully fetched user data, and they are NOT verified
  const isRedirecting = session && !loadingUserData && userWithBVN && !bvnVerified && !isKycPage && !isSettingsPage
  
  useEffect(() => {
    // Only redirect if we have session data, BVN is confirmed not verified, and we're done loading
    if (session && !loadingUserData && userWithBVN && !bvnVerified && !isKycPage && !isSettingsPage) {
      router.push("/dashboard/kyc")
    }
  }, [session, bvnVerified, isKycPage, isSettingsPage, router, loadingUserData, userWithBVN])

  if (isSessionPending || loadingUserData || isRedirecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C3AFA]"></div>
      </div>
    )
  }

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U"

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between lg:block">
        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <Image 
              src="/esux-logo.png" 
              alt="EsuX Logo" 
              fill 
              className="object-contain" 
            />
          </div>
          <span className="text-xl font-bold tracking-tighter text-neutral-900 dark:text-white">
            EsuX
          </span>
        </Link>
        <button 
          className="lg:hidden p-2 text-neutral-500"
          onClick={() => setMobileMenuOpen(false)}
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#6C3AFA]/10 text-[#6C3AFA] border border-[#6C3AFA]/20 dark:bg-[#6C3AFA]/20 dark:text-[#a085ff]" 
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-[#00D4AA]" : "text-neutral-500 dark:text-neutral-500")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200/40 dark:border-white/10">
        <button 
          onClick={() => {
            setMobileMenuOpen(false);
            setShowLogout(true);
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/50 dark:hover:bg-white/5 hover:text-red-500 transition-colors"
        >
          <LogOutIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <div 
      className="relative flex h-screen w-full text-neutral-900 dark:text-neutral-100 overflow-hidden bg-background"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(rgba(0,0,0,0.08)_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(rgba(255,255,255,0.15)_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
      <div className="absolute inset-0 z-0 bg-white/10 dark:bg-black/40" />
      <div className="absolute top-[-40px] right-20 w-80 h-80 bg-[#6C3AFA]/10 dark:bg-[#6C3AFA]/15 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse duration-5000" />
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00D4AA]/10 dark:bg-[#00D4AA]/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse duration-7000" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-purple-400/5 dark:bg-purple-400/10 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <aside className="relative z-20 hidden lg:flex w-64 border-r border-neutral-200/40 dark:border-white/10 bg-white/60 dark:bg-neutral-950/60 flex-col backdrop-blur-md">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Slide-over) */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside className={cn(
          "absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-neutral-950 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent />
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 border-b border-neutral-200/40 dark:border-white/10 flex items-center justify-between px-4 lg:px-8 backdrop-blur-md bg-white/60 dark:bg-neutral-950/60">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
              Welcome, <span className="text-neutral-900 dark:text-white font-semibold">{session?.user?.name || "User"}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-[#6C3AFA]/20 border border-[#6C3AFA]/10 flex items-center justify-center text-xs font-bold text-[#6C3AFA] dark:text-[#a085ff]">
              {initials}
            </div>
          </div>
        </header>

        {/* Dynamic Page Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-transparent">
          {children}
        </main>
      </div>

      {/* Logout Dialog */}
      {showLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200/60 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl mx-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Sign Out?</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowLogout(false)} className="border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300">
                Cancel
              </Button>
              <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white">
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
