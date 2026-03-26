"use client"

import { Button } from "@/components/ui/button"
import { PrinterIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

export function ReceiptActions() {
  return (
    <div className="flex justify-between items-center print:hidden">
      <Link href="/dashboard/contributions">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-4 h-4" /> Back to History
        </Button>
      </Link>
      <Button 
        onClick={() => window.print()} 
        className="bg-[#6C3AFA] hover:bg-[#5B30D9] text-white"
      >
        <PrinterIcon className="w-4 h-4 mr-2" /> Print Receipt
      </Button>
    </div>
  )
}
