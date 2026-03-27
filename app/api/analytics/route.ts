import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { contributions, rounds, circleMembers } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. All contributions by this user
    const userContributions = await db.select().from(contributions).where(
      and(
        eq(contributions.memberId, userId),
        eq(contributions.paymentVerified, true)
      )
    ).orderBy(desc(contributions.paidAt));

    // 2. Active rounds joined
    const memberships = await db.select().from(circleMembers).where(
        and(eq(circleMembers.userId, userId), eq(circleMembers.status, "accepted"))
    );
    const circleIds = memberships.map(m => m.circleId);
    
    let activeRoundsCount = 0;
    if (circleIds.length > 0) {
        const activeRounds = await db.select().from(rounds).where(
            and(
                sql`${rounds.circleId} IN ${circleIds}`,
                eq(rounds.status, "ongoing")
            )
        );
        activeRoundsCount = activeRounds.length;
    }

    // 3. Analytics calculations
    const totalPaid = userContributions.reduce((sum, c) => sum + parseFloat(c.amountPaid), 0);
    const avgContribution = userContributions.length > 0 ? totalPaid / userContributions.length : 0;
    
    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.toLocaleString('default', { month: 'short' });
        const monthNum = d.getMonth() + 1;
        const year = d.getFullYear();
        
        const monthTotal = userContributions.filter(c => {
            if (!c.paidAt) return false;
            const pd = new Date(c.paidAt);
            return pd.getMonth() + 1 === monthNum && pd.getFullYear() === year;
        }).reduce((sum, c) => sum + parseFloat(c.amountPaid), 0);
        
        monthlyTrends.push({ month, total: monthTotal });
    }

    // Success Rate (simplified: verified / total records)
    const allRecords = await db.select().from(contributions).where(eq(contributions.memberId, userId));
    const successRate = allRecords.length > 0 
        ? (userContributions.length / allRecords.length) * 100 
        : 100;

    return NextResponse.json({
      avgContribution,
      activeRoundsCount,
      successRate: Math.round(successRate),
      monthlyTrends
    });
  } catch (error) {
    console.error("[Analytics Error]:", error);
    return NextResponse.json({ message: "Failed to fetch analytics" }, { status: 500 });
  }
}
