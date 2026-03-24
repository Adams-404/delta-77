import { NextResponse } from 'next/server';
import { twilioClient, VERIFY_SERVICE_ID } from '@/lib/twilio';
import { db } from '@/lib/db';
import { user, verificationLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.phoneNumber || !body.code) {
      return NextResponse.json({ error: 'Missing phoneNumber or code in request body' }, { status: 400 });
    }

    const { phoneNumber, code } = body;
    const userId = session.user.id;

    const verificationCheck = await twilioClient.verify.v2.services(VERIFY_SERVICE_ID)
      .verificationChecks.create({ to: phoneNumber, code });

    if (verificationCheck.valid) {
      await db.update(user)
        .set({ phoneVerified: true, phoneNumber })
        .where(eq(user.id, userId));
    }

    await db.insert(verificationLogs).values({
      userId,
      provider: 'twilio',
      type: 'otp',
      status: verificationCheck.valid ? 'success' : 'failed',
      message: verificationCheck.valid ? 'OTP Verified' : 'Invalid OTP'
    });

    return NextResponse.json({ 
      status: verificationCheck.status,
      valid: verificationCheck.valid 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
