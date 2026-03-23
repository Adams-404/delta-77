import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { contributions, rounds } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { circleId, amount, slug } = await req.json()

  if (!circleId || !amount) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
  }

  try {
    // --- Mock Interswitch Payment Initiation ---
    // Generate a unique transaction reference
    const transactionRef = `ESUX_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`

    // 1. Find active round for this circle
    const activeRound = await db.query.rounds.findFirst({
        where: eq(rounds.circleId, circleId)
        // In reality, you'd filter by status='ongoing'
    })

    if (!activeRound) {
        return NextResponse.json({ message: "No active round found for this circle" }, { status: 404 })
    }

    // 2. Create contribution record (pending)
    await db.insert(contributions).values({
        id: crypto.randomUUID(),
        roundId: activeRound.id,
        memberId: session.user.id,
        amountExpected: amount,
        amountPaid: "0", 
        transactionRef: transactionRef,
        paymentVerified: false, 
    })

    // Update round total collected
    // await db.update(rounds).set(...)

    return NextResponse.json({ 
        success: true, 
        message: "Payment successfully logged",
        transactionRef,
        // redirectUrl: "https://webpay.interswitchng.com/..." 
    })
  } catch (error) {
    console.error("Payment Initiation Error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
