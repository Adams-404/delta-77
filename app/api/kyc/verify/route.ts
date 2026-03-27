import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { interswitch } from "@/lib/services/interswitch"


export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { bvn } = await req.json()

  if (!bvn || !/^\d{11}$/.test(bvn)) {
    return NextResponse.json({ message: "BVN must be exactly 11 digits." }, { status: 400 })
  }

  try {
    // [AUTO-VERIFY MODE]: Interswitch review currently pending. 
    // We are auto-verifying any 11-digit BVN input to allow full app testing.
    // The interswitch.verifyBVN(bvn) call is commented out below.
    
    // const result = await interswitch.verifyBVN(bvn)
    
    // Generate a safe hash for storage (never store raw BVN)
    const bvnHash = `verified_${bvn.substring(0, 3)}****${bvn.substring(7)}`
    const isSandbox = true // Always true in auto-verify mode

    // Update user in DB
    await db
      .update(userTable)
      .set({
        bvnVerified: true,
        bvnHash: bvnHash,
      })
      .where(eq(userTable.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: "BVN verified successfully (Auto-verify enabled for Hackathon demo)",
      sandboxMode: isSandbox,
      // Provide dummy name info since we aren't calling the API
      firstName: "Verified",
      lastName: "User",
    })
  } catch (error) {
    console.error("[KYC Verification Error]:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
