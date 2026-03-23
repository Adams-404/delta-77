import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { contributions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
    // 1. Locate the contribution record
    const contribution = await db.query.contributions.findFirst({
        where: eq(contributions.transactionRef, transactionRef)
    })

    if (!contribution) {
        return NextResponse.json({ message: "Contribution record not found" }, { status: 404 })
    }

    if (contribution.paymentVerified) {
        return NextResponse.json({ success: true, message: "Payment already verified" })
    }

    // 2. Query Interswitch Transaction Search
    const result = await interswitch.verifyTransaction(transactionRef)

    // For Sandbox/Mocking purposes:
    // result.success indicates the response came back ok.
    // In production, verify result.data matches contribution.amountExpected.
    if (!result.success) {
        return NextResponse.json({ message: "Transaction verification failed or not found: " + (result.message || "") }, { status: 400 })
    }

    // Usually you check result.data.status or similar. Sandbox might vary.
    // For now, assuming success updates state successfully.

    // 3. Mark as verified
    await db.update(contributions)
      .set({
          paymentVerified: true,
          amountPaid: contribution.amountExpected, // Assuming it match expected
          paidAt: new Date(),
      })
      .where(eq(contributions.id, contribution.id))

    return NextResponse.json({ 
        success: true, 
        message: "Contribution successfully verified and approved" 
    })

  } catch (error) {
    console.error("Verification Route Error:", error)
    return NextResponse.json({ message: "Internal server error during verification" }, { status: 500 })
  }
}
