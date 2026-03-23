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

  console.log("👉 [DEBUG] KYC verify requested with BVN:", bvn, "Length:", bvn?.length);

  if (!bvn || bvn.length !== 11) {
    console.log("❌ [DEBUG] Validation failed: Invalid BVN length or null.");
    return NextResponse.json({ message: "Invalid BVN" }, { status: 400 })
  }

  try {
    const result = await interswitch.verifyBVN(bvn);
    console.log("🔄 [DEBUG] Interswitch VerifyBVN Result:", result);

    if (!result.success) {
      console.log("❌ [DEBUG] Interswitch Verification failed:", result.message);
      return NextResponse.json({ message: result.message || "BVN Verification Failed" }, { status: 400 });
    }


    // Update user in DB
    await db
      .update(userTable)
      .set({ 
        bvnVerified: true,
        // In reality, you'd store a hash or partial info from Interswitch
        bvnHash: `verified_${bvn.substring(0, 3)}****${bvn.substring(7)}` 
      })
      .where(eq(userTable.id, session.user.id))

    return NextResponse.json({ success: true, message: "BVN verified successfully" })
  } catch (error) {
    console.error("KYC Verification Error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
