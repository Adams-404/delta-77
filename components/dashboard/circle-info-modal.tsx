"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InfoIcon, CheckCircleIcon, UsersIcon, ShieldCheckIcon } from "lucide-react"

export function CircleInfoModal({ circle }: { circle: any }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="text-xs flex items-center gap-1.5 rounded-full border-neutral-200/80 shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#6C3AFA]/10 hover:text-[#6C3AFA] hover:border-[#6C3AFA]/30"
      >
        <InfoIcon className="w-3.5 h-3.5 transition-colors duration-300" /> Guide
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white border-2 border-neutral-200/60 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-xl relative animate-in zoom-in-95 duration-250">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-purple-500" /> Circle Guide Rules
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Understand how your savings pool functions and the rules governing it.</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200/60 shrink-0">
                  <UsersIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Populating your Circle</h4>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    Share the <strong className="font-bold text-neutral-800">Circle ID</strong> code with trusted participants. Once capacity reaches <strong className="font-bold text-neutral-800">{circle.maxMembers} members</strong>, cycles trigger automatically and securely through rotational rounds.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200/60 shrink-0">
                  <CheckCircleIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Circle Lifecycle Status</h4>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    {circle.status === "pending" ? (
                      <>
                        This circle is currently <span className="font-semibold text-neutral-800">Pending</span>. Organizers are vetting incoming requests right now. Once approved slots reach capacity, the status will shift automatically into <span className="font-semibold text-neutral-800">Active</span>.
                      </>
                    ) : (
                      <>
                        The current status is <span className="font-semibold text-neutral-800">Active</span>. Periodical rotation collection and transfer cycles are automated and executed following the cycle schedule.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setIsOpen(false)} className="w-full bg-[#6C3AFA] hover:bg-[#5B30D9] text-white text-xs">
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
