import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return NextResponse.json({ error: "No session found" }, { status: 401 })
  }

  try {
    // Get user data from database
    const userData = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        bvnVerified: userTable.bvnVerified,
        bvnHash: userTable.bvnHash,
        bvnNumber: userTable.bvnNumber,
        phoneVerified: userTable.phoneVerified
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1)

    return NextResponse.json(userData[0] || null)
  } catch (error) {
    console.error("User status endpoint error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
