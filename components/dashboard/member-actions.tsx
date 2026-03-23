"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { approveMemberAction } from "@/app/actions/circles"
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from "lucide-react"

export function MemberActions({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"accepted" | "rejected" | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAction = async () => {
    if (!targetStatus) return
    setLoading(true)
    try {
      await approveMemberAction(memberId, targetStatus)
      setSuccess(true)
      setTimeout(() => {
        setShowConfirm(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      alert("Failed to update member status.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={() => { setTargetStatus("accepted"); setShowConfirm(true); }}
          className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white text-[10px] rounded-md"
        >
          Accept
        </Button>
        <Button
          size="sm"
          onClick={() => { setTargetStatus("rejected"); setShowConfirm(true); }}
          className="h-6 px-2 bg-red-500 hover:bg-red-600 text-white text-[10px] rounded-md"
        >
          Reject
        </Button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white border-2 border-neutral-200/60 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            {success ? (
              <div className="space-y-2 py-4 animate-in zoom-in-50 duration-250">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center border border-green-200 mx-auto">
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-bold text-neutral-900">Success!</h3>
                <p className="text-xs text-neutral-500">Member has been {targetStatus === "accepted" ? "approved" : "rejected"}.</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 mx-auto">
                  <AlertTriangleIcon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Are you sure?</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {targetStatus === "accepted" 
                      ? "Approving will grant them access to this circle so they can participate in rounds." 
                      : "They won't be added to the circle if you reject this request."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" className="w-full text-xs" onClick={() => setShowConfirm(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAction}
                    disabled={loading}
                    className={`w-full text-xs text-white ${targetStatus === "accepted" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                  >
                    {loading ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
