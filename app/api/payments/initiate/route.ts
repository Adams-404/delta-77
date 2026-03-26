import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { contributions, rounds } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { interswitch } from "@/lib/services/interswitch"

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { circleId, amount, redirectUrl } = await req.json()

  if (!circleId || !amount) {
    return NextResponse.json({ message: "Missing required fields: circleId and amount" }, { status: 400 })
  }

  const amountInKobo = Math.round(parseFloat(amount) * 100)
  if (isNaN(amountInKobo) || amountInKobo <= 0) {
    return NextResponse.json({ message: "Invalid amount" }, { status: 400 })
  }

  try {
    // Generate a unique transaction reference
    const transactionRef = `ESUX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Find active round for this circle
    const activeRound = await db.query.rounds.findFirst({
      where: eq(rounds.circleId, circleId),
      // TODO: Add status filter: eq(rounds.status, 'ongoing')
    })

    if (!activeRound) {
      return NextResponse.json({ message: "No active round found for this circle" }, { status: 404 })
    }

    // Create a pending contribution record
    await db.insert(contributions).values({
      id: crypto.randomUUID(),
      roundId: activeRound.id,
      memberId: session.user.id,
      amountExpected: amount.toString(),
      amountPaid: "0",
      transactionRef: transactionRef,
      paymentVerified: false,
    })

    // Build Interswitch Web Checkout params
    const callbackUrl = redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contributions?txnref=${transactionRef}`
    const checkoutParams = interswitch.buildCheckoutParams({
      transactionRef,
      amountInKobo,
      redirectUrl: callbackUrl,
      customerEmail: session.user.email,
    })

    return NextResponse.json({
      success: true,
      transactionRef,
      checkout: checkoutParams,
      message: "Payment initiated. Use checkout params to open payment widget.",
    })
  } catch (error) {
    console.error("[Payment Initiation Error]:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
