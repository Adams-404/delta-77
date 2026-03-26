import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { contributions, rounds, circles } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { interswitch } from "@/lib/services/interswitch"

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { transactionRef } = await req.json()

  if (!transactionRef) {
    return NextResponse.json({ message: "Missing Transaction Reference" }, { status: 400 })
  }

  try {
    // Locate the contribution record
    const contribution = await db.query.contributions.findFirst({
      where: eq(contributions.transactionRef, transactionRef)
    })

    if (!contribution) {
      return NextResponse.json({ message: "Contribution record not found" }, { status: 404 })
    }

    if (contribution.paymentVerified) {
      return NextResponse.json({ success: true, message: "Payment already verified" })
    }

    // Convert expected amount to kobo for verification
    const amountInKobo = Math.round(parseFloat(contribution.amountExpected) * 100)

    // Query Interswitch transaction status
    const result = await interswitch.verifyTransaction(transactionRef, amountInKobo)

    if (!result.success) {
      return NextResponse.json({
        message: "Transaction verification failed: " + (result.message || "Unknown error"),
        data: result.data,
      }, { status: 400 })
    }

    // Mark contribution as verified
    await db.update(contributions)
      .set({
        paymentVerified: true,
        amountPaid: contribution.amountExpected,
        paidAt: new Date(),
      })
      .where(eq(contributions.id, contribution.id))

    // Update the 'rounds' total collected amount
    await db.update(rounds)
      .set({
        totalCollected: sql`${rounds.totalCollected} + ${contribution.amountExpected}`
      })
      .where(eq(rounds.id, contribution.roundId))

    // Fetch the circle to check status
    const activeRound = await db.query.rounds.findFirst({
        where: eq(rounds.id, contribution.roundId),
        with: {
            circle: true
        }
    })

    // If circle is pending, move it to 'active' now that money is coming in
    if (activeRound?.circle?.status === 'pending') {
        await db.update(circles)
            .set({ 
                status: 'active',
                startDate: new Date()
            })
            .where(eq(circles.id, activeRound.circle.id))
        console.log(`[Verify] Circle ${activeRound.circle.id} is now ACTIVE.`)
    }

    return NextResponse.json({
      success: true,
      message: "Contribution successfully verified and approved",
      sandboxMock: result.data?._sandboxMock ?? false,
    })

  } catch (error) {
    console.error("[Contributions Verify Error]:", error)
    return NextResponse.json({ message: "Internal server error during verification" }, { status: 500 })
  }
}
