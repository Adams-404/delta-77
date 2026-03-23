"use client"
import { LiquidMetalBackground } from "@/components/liquid-metal-background"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4">
      <LiquidMetalBackground />
      <div className="fixed inset-0 z-[5] bg-black/50" />
      
      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="text-white hover:text-gray-300 transition-colors flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-[#6C3AFA] to-[#00D4AA] bg-clip-text text-transparent">
            EsuX
          </span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
