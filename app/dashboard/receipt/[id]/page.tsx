import { db } from "@/lib/db/client"
import { contributions, rounds, circles, user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { ReceiptActions } from "@/components/dashboard/receipt-actions"

export default async function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) return notFound()

  const [receipt] = await db
    .select({
      id: contributions.id,
      amount: contributions.amountPaid,
      date: contributions.paidAt,
      reference: contributions.transactionRef,
      circleName: circles.name,
      payerName: userTable.name,
      payerEmail: userTable.email
    })
    .from(contributions)
    .innerJoin(rounds, eq(contributions.roundId, rounds.id))
    .innerJoin(circles, eq(rounds.circleId, circles.id))
    .innerJoin(userTable, eq(contributions.memberId, userTable.id))
    .where(eq(contributions.id, id))

  if (!receipt) return notFound()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-4 py-12 md:p-12 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation - Hidden on Print */}
        <ReceiptActions />

        {/* Receipt Container */}
        <div className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden print:border-0 print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="bg-[#6C3AFA] p-8 text-white relative flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-3xl font-black italic tracking-tighter">EsuX</h1>
              <p className="opacity-80 text-sm font-medium">Digital Transaction Receipt</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Receipt For</span>
                  <p className="text-lg font-bold text-foreground">{receipt.payerName}</p>
                  <p className="text-sm text-muted-foreground">{receipt.payerEmail}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Circle Beneficiary</span>
                  <p className="text-lg font-bold text-[#00D4AA]">{receipt.circleName}</p>
                </div>
              </div>

              <div className="space-y-4 md:text-right">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Transaction ID</span>
                  <p className="text-sm font-mono text-foreground break-all">{receipt.id}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reference</span>
                  <p className="text-sm font-mono text-foreground">{receipt.reference || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Date Paid</span>
                  <p className="text-sm text-foreground">{receipt.date ? new Date(receipt.date).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' }) : "Pending"}</p>
                </div>
              </div>
            </div>

            {/* Amount Banner */}
            <div className="bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-8 text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CheckCircle2Icon className="w-24 h-24 text-[#00D4AA]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">Total Contribution Paid</span>
                <p className="text-5xl font-black text-foreground">₦{parseFloat(receipt.amount).toLocaleString()}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 rounded-full text-[10px] font-bold uppercase tracking-wider mt-4">
                    <CheckCircle2Icon className="w-3 h-3" /> Verified by Interswitch
                </div>
            </div>

            {/* Footer */}
            <div className="pt-12 border-t border-neutral-100 dark:border-white/10 text-center space-y-4">
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                    This is an electronically generated receipt for your contribution to the rotational savings cycle. Keep this for your records. EsuX and Interswitch ensure all financial transactions are encrypted and verified.
                 </p>
                 <div className="flex justify-center gap-6 opacity-40 grayscale">
                    <img src="https://www.interswitchgroup.com/assets/images/logo.png" alt="Interswitch" className="h-6 object-contain" />
                    <span className="text-sm font-bold tracking-tighter self-center">EsuX SECURE</span>
                 </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground/60 print:hidden italic">
            Tip: Press Ctrl+P or use the Print button to save as PDF.
        </p>
      </div>
    </div>
  )
}
