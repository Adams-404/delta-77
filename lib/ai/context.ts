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

  // 1. Get circles where user is organizer OR member (by userId or phoneNumber)
  const memberEntries = await db
    .select({ circleId: circleMembersTable.circleId })
    .from(circleMembersTable)
    .where(
      or(
        userId ? eq(circleMembersTable.userId, userId) : undefined,
        phoneNumber ? eq(circleMembersTable.phoneNumber, phoneNumber) : undefined
      )
    );
  
  const circleIds = [...new Set(memberEntries.map((m: any) => m.circleId))];
  
  const userCircles = await db
    .select()
    .from(circlesTable)
    .where(
      or(
        userId ? eq(circlesTable.organizerId, userId) : undefined,
        circleIds.length > 0 ? or(...circleIds.map((id: string) => eq(circlesTable.id, id))) : undefined
      )
    );

  // 2. Get active rounds for these circles
  const activeRounds = circleIds.length > 0 
    ? await db.select().from(roundsTable).where(
        and(
          eq(roundsTable.status, "ongoing"),
          or(...circleIds.map((id: string) => eq(roundsTable.id, id))) // Corrected to match round.circleId or round.id? wait.
        )
      )
    : [];
  
  // Actually, rounds table uses circleId
  const correctRounds = circleIds.length > 0
    ? await db.select().from(roundsTable).where(
        and(
          eq(roundsTable.status, "ongoing"),
          or(...circleIds.map((id: string) => eq(roundsTable.circleId, id)))
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
    rounds: correctRounds,
    contributions: recentContributions,
  };
}
