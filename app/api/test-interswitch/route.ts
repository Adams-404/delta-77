import { NextResponse } from "next/server"
import { interswitch } from "@/lib/services/interswitch"

/**
 * GET /api/test-interswitch
 *
 * Test endpoint to verify Interswitch connectivity.
 * Tests: OAuth token acquisition, merchant code resolution.
 *
 * Only for development use — remove or secure before production.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: "Not available in production" }, { status: 403 })
  }

  const startTime = Date.now()

  try {
    const connectionResult = await interswitch.testConnection()
    const elapsed = Date.now() - startTime

    return NextResponse.json({
      status: connectionResult.tokenOk ? '✅ Connected' : '❌ Failed',
      tokenOk: connectionResult.tokenOk,
      merchantCode: connectionResult.merchantCode || process.env.ISW_MERCHANT_CODE || null,
      payItemId: process.env.ISW_PAY_ITEM_ID || null,
      baseUrl: process.env.ISW_BASE_URL,
      error: connectionResult.error || null,
      elapsedMs: elapsed,
      envCheck: {
        ISW_CLIENT_ID: !!process.env.ISW_CLIENT_ID,
        ISW_CLIENT_SECRET: !!process.env.ISW_CLIENT_SECRET,
        ISW_BASE_URL: !!process.env.ISW_BASE_URL,
        ISW_MERCHANT_CODE: !!process.env.ISW_MERCHANT_CODE,
        ISW_PAY_ITEM_ID: !!process.env.ISW_PAY_ITEM_ID,
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: '❌ Error',
      tokenOk: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      elapsedMs: Date.now() - startTime,
    }, { status: 500 })
  }
}
