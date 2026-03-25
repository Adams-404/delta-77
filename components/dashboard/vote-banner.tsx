"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckIcon, XIcon, InfoIcon } from "lucide-react"
import { voteUpdateAction } from "@/app/actions/circles"

export function VoteBanner({ circle, viewerId }: { circle: any, viewerId: string }) {
  const [loading, setLoading] = useState(false)

  const isOrganizer = viewerId === circle.organizerId;
  const approvedBy = circle.approvedBy || [];
  const rejectedBy = circle.rejectedBy || [];
  const hasVoted = approvedBy.includes(viewerId) || rejectedBy.includes(viewerId);

  const hasPending = circle.pendingName || circle.pendingContributionAmount;

  if (!hasPending) return null;

  const handleVote = async (vote: "approve" | "reject") => {
    setLoading(true)
    try {
      const res = await voteUpdateAction(circle.id, vote)
      if (res.success) {
         window.location.reload(); // Quick refresh to sync serverside state triggers
      }
    } catch (err: any) {
      alert(err.message || "Failed to vote")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
      <div className="flex gap-3 items-start md:items-center">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 shrink-0">
          <InfoIcon className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Proposed Update Pending</h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
            {circle.pendingName && <>Change Name to <strong className="font-semibold text-neutral-800 dark:text-neutral-200">"{circle.pendingName}"</strong></>}
            {circle.pendingName && circle.pendingContributionAmount && <> and </>}
            {circle.pendingContributionAmount && <>Change Amount to <strong className="font-semibold text-neutral-800 dark:text-neutral-200">₦{parseFloat(circle.pendingContributionAmount).toLocaleString()}</strong></>}
          </p>
          {isOrganizer && (
            <p className="text-[10px] text-amber-600 font-medium mt-1">
              🗳 {approvedBy.length} member{approvedBy.length !== 1 ? 's' : ''} approved so far. (Requires majority)
            </p>
          )}
        </div>
      </div>

      {!isOrganizer && !hasVoted && (
        <div className="flex gap-2 shrink-0">
          <Button 
            onClick={() => handleVote("approve")} 
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1 rounded-full shadow-sm"
          >
            <CheckIcon className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button 
            onClick={() => handleVote("reject")} 
            disabled={loading}
            variant="outline"
            className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 text-xs px-4 py-1.5 h-auto flex items-center gap-1 rounded-full"
          >
            <XIcon className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      )}

      {!isOrganizer && hasVoted && (
        <p className="text-xs font-semibold text-teal-600 flex items-center gap-1 shrink-0 bg-white dark:bg-teal-900/20 px-3 py-1 rounded-full border border-teal-100 dark:border-teal-500/20 shadow-sm">
          <CheckIcon className="w-3.5 h-3.5" /> Vote casted
        </p>
      )}
    </div>
  )
}
