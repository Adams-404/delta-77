import { db } from "@/lib/db";
import { 
  circles as circlesTable, 
  circleMembers as circleMembersTable, 
  rounds as roundsTable, 
  contributions as contributionsTable,
  user as userTable
} from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function getUserContext(userId: string) {
  // 1. Get circles where user is organizer or member
  const memberEntries = await db
    .select({ circleId: circleMembersTable.circleId })
    .from(circleMembersTable)
    .where(eq(circleMembersTable.userId, userId));
  
  const circleIds = memberEntries.map((m: any) => m.circleId);
  
  const userCircles = await db
    .select()
    .from(circlesTable)
    .where(
      or(
        eq(circlesTable.organizerId, userId),
        circleIds.length > 0 ? and(or(...circleIds.map((id: string) => eq(circlesTable.id, id)))) : undefined
      )
    );

  // 2. Get active rounds for these circles
  const activeRounds = circleIds.length > 0 
    ? await db.select().from(roundsTable).where(
        and(
          eq(roundsTable.status, "ongoing"),
          or(...circleIds.map((id: string) => eq(roundsTable.circleId, id)))
        )
      )
    : [];

  // 3. Get user's recent contributions
  const recentContributions = await db
    .select()
    .from(contributionsTable)
    .where(eq(contributionsTable.memberId, userId));

  return {
    circles: userCircles,
    rounds: activeRounds,
    contributions: recentContributions,
  };
}
