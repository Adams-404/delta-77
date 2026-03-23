import { NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { circles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.slug, slug))

    if (!circle) {
      return NextResponse.json({ message: "Circle not found" }, { status: 404 })
    }

    return NextResponse.json(circle)
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
