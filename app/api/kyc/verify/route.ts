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
    const result = await interswitch.verifyBVN(bvn)

    if (!result.success) {
      return NextResponse.json({
        message: result.message || "BVN Verification Failed"
      }, { status: 400 })
    }

    // Generate a safe hash for storage (never store raw BVN)
    const bvnHash = `verified_${bvn.substring(0, 3)}****${bvn.substring(7)}`
    const isSandbox = result.data?._sandboxMock === true

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
      message: isSandbox
        ? "BVN verified successfully (sandbox mode — BVN API not yet enabled for live calls)"
        : "BVN verified successfully",
      sandboxMode: isSandbox,
      // Return partial name info if available from Interswitch
      firstName: result.data?.firstName,
      lastName: result.data?.lastName,
    })
  } catch (error) {
    console.error("[KYC Verification Error]:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
