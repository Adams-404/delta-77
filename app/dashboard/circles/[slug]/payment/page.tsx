"use client"
import { useState, useEffect } from "react"
import { CreditCardIcon, Loader2Icon, CheckCircle2Icon, AlertCircleIcon, ArrowLeftIcon, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function CirclePaymentPage() {
  const params = useParams()
  const slug = params.slug
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [circle, setCircle] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch circle details briefly for the payment context
    const fetchCircle = async () => {
      try {
        const res = await fetch(`/api/circles/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setCircle(data)
        }
      } catch (err) {
        console.error("Failed to fetch circle for payment", err)
      }
    }
    fetchCircle()
  }, [slug])

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circleId: circle?.id,
          amount: circle?.contributionAmount,
          slug: slug
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Payment initialization failed")
      }

      // Load Interswitch Script dynamically
      const script = document.createElement('script');
      script.src = data.checkout.checkoutScript;
      script.onload = () => {
        // @ts-ignore
        if (typeof window.webpayCheckout === 'function') {
          // Callback after Interswitch finishes
          const onComplete = (response: any) => {
            console.log("Interswitch response:", response);
            // Verify payment on server
            handleVerification(data.transactionRef);
          };

          const checkoutParams = {
            ...data.checkout,
            onComplete: onComplete
          };
          
          // @ts-ignore
          window.webpayCheckout(checkoutParams);
        } else {
          setError("Interswitch payment script failed to initialize.");
          setLoading(false);
        }
      };
      script.onerror = () => {
        setError("Failed to load Interswitch payment script.");
        setLoading(false);
      };
      document.body.appendChild(script);

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleVerification = async (transactionRef: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contributions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionRef }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/circles/${slug}`);
        }, 3000);
      } else {
        setError(data.message || "Payment verification failed. Please contact support.");
      }
    } catch (err) {
      setError("An error occurred during verification. Please check your history.");
    } finally {
      setLoading(false);
    }
  }

  if (!circle) return null

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#00D4AA]/10 flex items-center justify-center border border-[#00D4AA]/20">
          <CheckCircle2Icon className="w-10 h-10 text-[#00D4AA]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Contribution Received!</h1>
          <p className="text-muted-foreground">Successfully processed via Interswitch. Your contribution to {circle.name} has been logged.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl w-full py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/circles/${slug}`} className="cursor-pointer">
          <Button variant="ghost" size="icon" className="rounded-full border border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-white/5 shrink-0 cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-open-sans-custom">Circle Contribution</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Securing your spot in the rotational payout cycle for <span className="text-foreground font-semibold">{circle.name}</span>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details & Payment Method */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6 space-y-5 shadow-none border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-neutral-900/50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Circle Details</h2>
              <span className="px-3 py-1 bg-teal-500/10 text-[#00D4AA] border border-[#00D4AA]/20 rounded-full text-xs font-medium uppercase">
                {circle.status}
              </span>
            </div>

            {circle.description && (
              <p className="text-sm text-muted-foreground">
                {circle.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <CreditCardIcon className="w-3 h-3 text-[#6C3AFA]" /> Contribution
                </span>
                <p className="text-lg font-bold text-foreground mt-1">
                  ₦{parseFloat(circle.contributionAmount).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-[#00D4AA]" /> Frequency
                </span>
                <p className="text-lg font-bold text-foreground mt-1 capitalize">
                  {circle.frequency}
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</h3>
             
            <GlassCard className="p-5 flex flex-col gap-6 border-[#6C3AFA]/40 dark:border-[#6C3AFA]/40 bg-[#6C3AFA]/5 dark:bg-[#6C3AFA]/5 shadow-none group transition-all">
              {/* Header row */}
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 bg-[#6C3AFA]/10 rounded-xl">
                  <CreditCardIcon className="w-6 h-6 text-[#6C3AFA]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-foreground text-sm">Interswitch Webpay</h4>
                  <p className="text-xs text-muted-foreground">Pay securely with your Card or Bank Account</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#00D4AA] flex items-center justify-center">
                  <CheckCircle2Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Simulated Visa Card Form mockup INSIDE GlassCard */}
              <div className="flex justify-center w-full pt-2">
                <div className="flex flex-col items-start justify-end w-full max-w-[360px] aspect-[1.586] rounded-2xl p-6 font-sans relative gap-4 overflow-hidden border border-white/20 cursor-pointer group"
                     style={{ background: 'linear-gradient(135deg, #4432A7 0%, #6C3AFA 50%, #8A2BE2 100%)' }}>
                  
                  {/* Glass reflection overlay for premium look */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />

                  <div className="w-full flex items-center justify-end h-fit absolute top-0 left-0 p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 48 48" className="h-9 w-auto opacity-90 filter drop-shadow">
                      <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"></path>
                      <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"></path>
                      <path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"></path>
                    </svg>
                  </div>

                  {/* Microchip Detail */}
                  <div className="absolute top-6 left-6 w-11 h-8 bg-gradient-to-br from-amber-200 to-amber-400 rounded-md overflow-hidden border border-amber-600/20 shadow-inner">
                     <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 opacity-30">
                         <div className="border border-amber-900/30"></div>
                         <div className="border border-amber-900/30"></div>
                     </div>
                  </div>

                  <div className="w-full h-fit flex flex-col relative z-10">
                    <label className="text-[9px] font-bold tracking-wider text-white/70 w-full mb-1" htmlFor="cardNumber">CARD NUMBER</label>
                    <input
                      className="bg-transparent border-none outline-none text-white text-lg font-bold h-[28px] tracking-[2px] placeholder:text-white/40 focus:ring-0 p-0 focus:border-none"
                      id="cardNumber"
                      placeholder="XXXX XXXX XXXX XXXX"
                      name="cardNumber"
                      type="text"
                    />
                  </div>

                  <div className="w-full h-fit flex gap-3 relative z-10">
                    <div className="w-3/5 h-fit flex flex-col">
                      <label className="text-[9px] font-bold tracking-wider text-white/70 w-full mb-1" htmlFor="holderName">CARD HOLDER</label>
                      <input
                        className="bg-transparent border-none outline-none text-white text-[13px] h-[25px] tracking-wider placeholder:text-white/40 focus:ring-0 p-0"
                        id="holderName"
                        placeholder="NAME"
                        type="text"
                      />
                    </div>

                    <div className="w-[22%] h-fit flex flex-col">
                      <label className="text-[9px] font-bold tracking-wider text-white/70 w-full mb-1" htmlFor="expiry">VALID THRU</label>
                      <input 
                        className="bg-transparent border-none outline-none text-white text-[13px] h-[25px] tracking-wider placeholder:text-white/40 focus:ring-0 p-0" 
                        id="expiry" 
                        placeholder="MM/YY" 
                        type="text" 
                      />
                    </div>
                    <div className="w-[18%] h-fit flex flex-col">
                      <label className="text-[9px] font-bold tracking-wider text-white/70 w-full mb-1" htmlFor="cvv">CVV</label>
                      <input
                        className="bg-transparent border-none outline-none text-white text-[13px] h-[25px] tracking-wider placeholder:text-white/40 focus:ring-0 p-0"
                        placeholder="***"
                        maxLength={3}
                        id="cvv"
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-6">
            <GlassCard className="p-6 space-y-6 shadow-none border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-neutral-900/50">
              <h3 className="text-lg font-bold text-foreground">Payment Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contribution Amount</span>
                  <span className="font-bold text-foreground">₦{parseFloat(circle.contributionAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-bold text-foreground">₦0.00</span>
                </div>
                <div className="pt-4 border-t border-neutral-100 dark:border-white/10 flex justify-between items-center">
                  <span className="font-bold text-foreground text-base">Total to Pay</span>
                  <span className="font-bold text-[#00D4AA] text-xl">₦{parseFloat(circle.contributionAmount).toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
                  <AlertCircleIcon className="w-4 h-4" /> {error}
                </div>
              )}

              <style>{`
                .chk-btn {
                  background-color: #ffffff;
                  display: flex;
                  width: 100%;
                  height: 100px;
                  position: relative;
                  border-radius: 12px;
                  transition: 0.3s ease-in-out;
                  border: 1px solid rgba(0,0,0,0.06);
                  cursor: pointer;
                  overflow: hidden;
                }
                .chk-btn:hover { transform: scale(1.02); }
                .chk-btn:hover .chk-left { width: 100%; }
                .chk-left {
                  background-color: #5de2a3;
                  width: 110px;
                  height: 100px;
                  border-radius: 10px;
                  position: relative;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
                  flex-shrink: 0;
                  overflow: hidden;
                }
                .chk-right {
                  display: flex;
                  align-items: center;
                  overflow: hidden;
                  justify-content: center;
                  white-space: nowrap;
                  transition: 0.3s;
                  flex: 1;
                }
                .chk-new {
                  font-size: 20px;
                  font-weight: 700;
                  color: #1a1a1a;
                  font-family: sans-serif;
                }
                .chk-card {
                  width: 65px;
                  height: 42px;
                  background-color: #c7ffbc;
                  border-radius: 6px;
                  position: absolute;
                  display: flex;
                  z-index: 10;
                  flex-direction: column;
                  align-items: center;
                }
                .chk-card-line {
                  width: 58px;
                  height: 11px;
                  background-color: #80ea69;
                  border-radius: 2px;
                  margin-top: 6px;
                }
                .chk-buttons {
                  width: 8px;
                  height: 8px;
                  background-color: #379e1f;
                  box-shadow: 0 -10px 0 0 #26850e, 0 10px 0 0 #56be3e;
                  border-radius: 50%;
                  margin-top: 5px;
                  transform: rotate(90deg);
                  margin: 8px 0 0 -25px;
                }
                .chk-btn:hover .chk-card { animation: slide-top-chk 1.2s cubic-bezier(0.645, 0.045, 0.355, 1) both; }
                .chk-btn:hover .chk-post { animation: slide-post-chk 1s cubic-bezier(0.165, 0.84, 0.44, 1) both; }
                @keyframes slide-top-chk {
                  0% { transform: translateY(0); }
                  50% { transform: translateY(-70px) rotate(90deg); }
                  60% { transform: translateY(-70px) rotate(90deg); }
                  100% { transform: translateY(-8px) rotate(90deg); }
                }
                .chk-post {
                  width: 58px;
                  height: 70px;
                  background-color: #dddde0;
                  position: absolute;
                  z-index: 11;
                  bottom: 10px;
                  top: 100px;
                  border-radius: 6px;
                  overflow: hidden;
                }
                .chk-post-line {
                  width: 44px;
                  height: 9px;
                  background-color: #545354;
                  position: absolute;
                  border-radius: 0px 0px 3px 3px;
                  right: 7px;
                  top: 7px;
                }
                .chk-post-line:before {
                  content: "";
                  position: absolute;
                  width: 44px;
                  height: 9px;
                  background-color: #757375;
                  top: -8px;
                  left: 0;
                }
                .chk-screen {
                  width: 44px;
                  height: 22px;
                  background-color: #ffffff;
                  position: absolute;
                  top: 20px;
                  right: 7px;
                  border-radius: 3px;
                }
                .chk-numbers {
                  width: 11px;
                  height: 11px;
                  background-color: #838183;
                  box-shadow: 0 -16px 0 0 #838183, 0 16px 0 0 #838183;
                  border-radius: 2px;
                  position: absolute;
                  transform: rotate(90deg);
                  left: 23px;
                  top: 48px;
                }
                .chk-numbers-line2 {
                  width: 11px;
                  height: 11px;
                  background-color: #aaa9ab;
                  box-shadow: 0 -16px 0 0 #aaa9ab, 0 16px 0 0 #aaa9ab;
                  border-radius: 2px;
                  position: absolute;
                  transform: rotate(90deg);
                  left: 23px;
                  top: 62px;
                }
                @keyframes slide-post-chk {
                  50% { transform: translateY(0); }
                  100% { transform: translateY(-65px); }
                }
                .chk-dollar {
                  position: absolute;
                  font-size: 14px;
                  font-weight: bold;
                  width: 100%;
                  left: 0;
                  top: 2px;
                  color: #4b953b;
                  text-align: center;
                }
                .chk-btn:hover .chk-dollar { animation: fade-in-fwd-chk 0.3s 1s backwards; }
                @keyframes fade-in-fwd-chk {
                  0% { opacity: 0; transform: translateY(-5px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div className="pt-2">
                {loading ? (
                  <div className="chk-btn" style={{ pointerEvents: 'none' }}>
                    <div className="chk-left" style={{ width: '100%' }}>
                      <span className="text-white font-bold flex items-center justify-center gap-2 w-full">
                        <Loader2Icon className="w-5 h-5 animate-spin" /> Processing...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="chk-btn" onClick={handlePayment}>
                    <div className="chk-left">
                      <div className="chk-card">
                        <div className="chk-card-line"></div>
                        <div className="chk-buttons"></div>
                      </div>
                      <div className="chk-post">
                        <div className="chk-post-line"></div>
                        <div className="chk-screen">
                          <div className="chk-dollar">$</div>
                        </div>
                        <div className="chk-numbers"></div>
                        <div className="chk-numbers-line2"></div>
                      </div>
                    </div>
                    <div className="chk-right">
                      <div className="chk-new">Pay Now</div>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-muted-foreground/60 italic">
                Redirects to Interswitch Secure Checkout
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
