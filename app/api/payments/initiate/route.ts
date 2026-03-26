import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { contributions, rounds, circles } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
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
    let activeRound = await db.query.rounds.findFirst({
      where: eq(rounds.circleId, circleId),
      // order by round number to get the current one
      orderBy: (rounds, { desc }) => [desc(rounds.roundNumber)],
    })

    // If no round exists, create the first one automatically
    if (!activeRound) {
      console.log(`[Payment] No round found for circle ${circleId}. Creating Round 1...`);
      
      const circleCount = await db.query.circles.findFirst({
        where: eq(circles.id, circleId),
      });

      if (!circleCount) {
        return NextResponse.json({ message: "Circle not found" }, { status: 404 });
      }

      const roundId = crypto.randomUUID();
      await db.insert(rounds).values({
        id: roundId,
        circleId: circleId,
        roundNumber: 1,
        totalExpected: (parseFloat(circleCount.contributionAmount) * circleCount.maxMembers).toString(),
        totalCollected: "0",
        status: "ongoing",
        startsAt: new Date(),
      });

      // Fetch the newly created round
      activeRound = await db.query.rounds.findFirst({
        where: eq(rounds.id, roundId),
      });
    }

    if (!activeRound) {
      return NextResponse.json({ message: "Failed to create or find an active round for this circle" }, { status: 500 })
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
