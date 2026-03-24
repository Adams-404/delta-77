import { NextResponse } from 'next/server';
import { twilioClient, VERIFY_SERVICE_ID } from '@/lib/twilio';
import { db } from '@/lib/db';
import { verificationLogs } from '@/lib/db/schema';
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.phoneNumber) {
      return NextResponse.json({ error: 'Missing phoneNumber in request body' }, { status: 400 });
    }

    const { phoneNumber } = body;
    const userId = session.user.id;

    const verification = await twilioClient.verify.v2.services(VERIFY_SERVICE_ID)
      .verifications.create({ to: phoneNumber, channel: 'whatsapp' });

    await db.insert(verificationLogs).values({
      userId,
      provider: 'twilio',
      type: 'otp',
      status: 'pending',
      message: `OTP sent to ${phoneNumber} via WhatsApp`
    });

    return NextResponse.json({ status: verification.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
