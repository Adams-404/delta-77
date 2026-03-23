"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "What is EsuX?",
    answer: "EsuX is a modern automation of traditional Esusu savings. It manages groups, tracks payments, and disburses payouts automatically via website or WhatsApp.",
  },
  {
    question: "Is my BVN safe?",
    answer: "Yes. We use Interswitch for BVN verification and never store your BVN. We only store a verification status and full name.",
  },
  {
    question: "What if someone doesn't pay?",
    answer: "The AI bot automatically triggers alerts to the circle and sends reminders. All members are BVN-verified to increase accountability and reduce ghosting.",
  },
  {
    question: "Which banks are supported?",
    answer: "EsuX is built for Nigeria and supports all commercial banks and major fintech institutions.",
  },
  {
    question: "Is there a fee?",
    answer: "Creating basic circles is free. Pro plans start at ₦500/month for unlimited circles with analytics.",
  },
  {
    question: "Can I use EsuX without WhatsApp?",
    answer: "Yes, you can use the smooth web dashboard dashboard for everything, but the WhatsApp bot gives you the convenience of managing circles without opening any app.",
  },
]

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-10 font-open-sans-custom [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div 
              key={index}
              className="border-2 border-white/10 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left text-white font-medium hover:bg-white/10 transition-colors"
                type="button"
                aria-expanded={isOpen}
              >
                <span className="font-open-sans-custom text-base md:text-lg">{faq.question}</span>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-gray-400 transition-transform duration-200",
                    isOpen && "transform rotate-180 text-white"
                  )} 
                />
              </button>
              
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="p-5 pt-0 text-gray-300 font-open-sans-custom text-sm md:text-base leading-relaxed border-t border-white/5 bg-white/2">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
