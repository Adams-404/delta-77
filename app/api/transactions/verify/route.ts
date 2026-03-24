import { NextResponse } from 'next/server';
import { generateInterswitchAuthHeaders, interswitchClient } from '@/lib/interswitch';
import { db } from '@/lib/db';
import { verificationLogs } from '@/lib/db/schema';
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');

  if (!ref || ref.trim() === '') {
    return NextResponse.json({ error: 'Missing or invalid transaction reference' }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const endpoint = `/api/v1/transactions?transactionreference=${ref}`;
    const headers = generateInterswitchAuthHeaders('GET', endpoint);

    const response = await interswitchClient.get(endpoint, { headers });
    const isSuccess = response.data?.responseCode === '00';

    // Audit Log: Transaction Verification
    await db.insert(verificationLogs).values({
      userId,
      provider: 'interswitch',
      type: 'transaction_verify',
      status: isSuccess ? 'success' : 'failed',
      message: isSuccess ? `Transaction ${ref} verified` : `Verification failed for ${ref}`
    });

    return NextResponse.json({
      ...response.data,
      isVerified: isSuccess
    });
  } catch (error: any) {
    console.error("Interswitch Transaction Error:", error.message);
    return NextResponse.json({ error: 'Could not verify transaction' }, { status: 500 });
  }
}
