import { db } from "@/lib/db";
import { 
  circles as circlesTable, 
  circleMembers as circleMembersTable, 
  rounds as roundsTable, 
  contributions as contributionsTable,
  user as userTable
} from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function getUserContext(userId: string | undefined | null, phoneNumber?: string) {
  if (!userId && !phoneNumber) return null;

  // 1. Get circles where user is a member (by userId or phoneNumber)
  const conditions = [];
  if (userId) conditions.push(eq(circleMembersTable.userId, userId));
  if (phoneNumber) conditions.push(eq(circleMembersTable.phoneNumber, phoneNumber));

  const memberEntries = await db
    .select({ circleId: circleMembersTable.circleId })
    .from(circleMembersTable)
    .where(or(...conditions));
  
  const circleIds = [...new Set(memberEntries.map((m: any) => m.circleId))];
  
  // 2. Get the actual circles
  const circleConditions = [];
  if (userId) circleConditions.push(eq(circlesTable.organizerId, userId));
  if (circleIds.length > 0) circleConditions.push(or(...circleIds.map((id: string) => eq(circlesTable.id, id))));

  const userCircles = circleConditions.length > 0 
    ? await db.select().from(circlesTable).where(or(...circleConditions))
    : [];

  // 3. Get active rounds for these circles
  const roundConditions = [];
  if (circleIds.length > 0) roundConditions.push(or(...circleIds.map((id: string) => eq(roundsTable.circleId, id))));

  const activeRounds = roundConditions.length > 0
    ? await db.select().from(roundsTable).where(
        and(
          eq(roundsTable.status, "ongoing"),
          ...roundConditions
        )
      )
    : [];

  // 3. Get user's recent contributions
  const recentContributions = userId 
    ? await db
        .select()
        .from(contributionsTable)
        .where(eq(contributionsTable.memberId, userId))
    : [];

  return {
    circles: userCircles,
    rounds: activeRounds,
    contributions: recentContributions,
  };
}
