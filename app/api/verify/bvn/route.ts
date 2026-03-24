import { NextResponse } from 'next/server';
import { generateInterswitchAuthHeaders, interswitchClient } from '@/lib/interswitch';
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
    if (!body || !body.bvn) {
      return NextResponse.json({ error: 'Missing BVN in request body' }, { status: 400 });
    }

    const { bvn, firstName, lastName } = body;
    const userId = session.user.id;
    
    // 1. Audit Log: Start
    await db.insert(verificationLogs).values({
      userId,
      provider: 'interswitch',
      type: 'bvn',
      status: 'pending',
      message: `Initiated BVN verification for ${bvn}`
    });

    const endpoint = '/api/v1/bvn/verify'; 
    const headers = generateInterswitchAuthHeaders('POST', endpoint);

    const response = await interswitchClient.post(endpoint, {
      bvn, firstName, lastName
    }, { headers });

    const isMatch = response.data?.responseCode === '00';

    // 2. Update User & Audit Log
    if (isMatch) {
      await db.update(user)
        .set({ bvnVerified: true, bvnNumber: bvn })
        .where(eq(user.id, userId));
    }

    await db.insert(verificationLogs).values({
      userId,
      provider: 'interswitch',
      type: 'bvn',
      status: isMatch ? 'success' : 'failed',
      message: isMatch ? 'BVN Match Found' : 'BVN Mismatch'
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
