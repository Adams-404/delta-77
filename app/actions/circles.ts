"use server"
import { db } from "@/lib/db/client";
import { circles, circleMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

// Helper to generate quick random string IDs
const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();
const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// --- Core Logic (Independent of Headers) ---

export async function createCircleCore(userId: string, data: {
  name: string;
  description: string;
  amount: string;
  frequency: string;
  maxMembers: number;
}) {
  const circleId = generateId();
  const slug = `${slugify(data.name)}-${circleId.toLowerCase()}`;

  await db.insert(circles).values({
    id: circleId,
    name: data.name,
    slug: slug,
    description: data.description,
    organizerId: userId,
    contributionAmount: data.amount,
    frequency: data.frequency.toLowerCase(),
    maxMembers: data.maxMembers,
    status: "pending",
    currentRound: 1,
  });

  // Automatically add organizer as a member
  await db.insert(circleMembers).values({
    id: generateId(),
    circleId: circleId,
    userId: userId,
    payoutPosition: 1,
    status: "accepted",
    joinedAt: new Date(),
  });

  return { success: true, circleId };
}

// --- Server Actions (Web Interface) ---

export async function createCircleAction(formData: {
  name: string;
  description: string;
  amount: string;
  frequency: string;
  maxMembers: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;

  if (!user) throw new Error("Unauthorized");

  const result = await createCircleCore(user.id, formData);

  revalidatePath("/dashboard");
  return result;
}

export async function joinCircleAction(circleId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;

  if (!user) throw new Error("Unauthorized");

  // Check if circle exists
  const [existing] = await db.select().from(circles).where(eq(circles.id, circleId));
  if (!existing) throw new Error("Circle not found");

  // Check if already joined
  const [existingMember] = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, user.id)));

  if (existingMember) {
    if (existingMember.status === "accepted") {
      throw new Error("You are already a member of this circle");
    }
    if (existingMember.status === "pending") {
      throw new Error("Your request to join this circle is already pending");
    }
    
    // Status must be "rejected", allow re-apply by updating status back to "pending"
    await db.update(circleMembers)
      .set({ status: "pending", joinedAt: new Date() })
      .where(eq(circleMembers.id, existingMember.id));
      
    revalidatePath("/dashboard");
    return { success: true };
  }

  await db.insert(circleMembers).values({
    id: generateId(),
    circleId: circleId,
    userId: user.id,
    status: "pending",
    joinedAt: new Date(),
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getCircleInfoAction(circleId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;

  if (!user) throw new Error("Unauthorized");

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
  if (!circle) return { found: false };

  const [member] = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, user.id)));

  return {
    found: true,
    circle,
    isMember: !!member && member.status === "accepted",
    isPending: !!member && member.status === "pending"
  };
}

export async function approveMemberAction(memberId: string, status: "accepted" | "rejected") {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;

  if (!user) throw new Error("Unauthorized");

  const [member] = await db.select().from(circleMembers).where(eq(circleMembers.id, memberId));
  if (!member) throw new Error("Member not found");

  const [circle] = await db.select().from(circles).where(eq(circles.id, member.circleId));
  if (circle.organizerId !== user.id) throw new Error("Only organizers can approve members");

  await db.update(circleMembers).set({ status }).where(eq(circleMembers.id, memberId));

  revalidatePath(`/dashboard/circles/${circle.slug || circle.id}`);
  return { success: true };
}

export async function updateCircleAction(circleId: string, formData: {
  description: string;
  maxMembers: number;
  name?: string;
  amount?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) throw new Error("Unauthorized");

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
  if (!circle) throw new Error("Circle not found");
  if (circle.organizerId !== user.id) throw new Error("Only organizers can update details");

  const members = await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.status, "accepted")));
  const totalCount = members.length;

  const updates: any = {
    description: formData.description,
    maxMembers: formData.maxMembers,
  };

  if (totalCount === 1) {
    if (formData.name) updates.name = formData.name;
    if (formData.amount) updates.contributionAmount = formData.amount;
  } else {
    // Multiple members: name and amount need consensus
    if (formData.name && formData.name !== circle.name) {
      updates.pendingName = formData.name;
      updates.approvedBy = []; // Reset approvals on new request
      updates.rejectedBy = []; // Reset rejections
    }
    if (formData.amount && formData.amount !== circle.contributionAmount) {
      updates.pendingContributionAmount = formData.amount;
      updates.approvedBy = [];
      updates.rejectedBy = [];
    }
  }

  await db.update(circles).set(updates).where(eq(circles.id, circleId));
  
  revalidatePath(`/dashboard/circles/${circle.slug || circleId}`);
  return { success: true };
}

export async function voteUpdateAction(circleId: string, vote: "approve" | "reject") {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) throw new Error("Unauthorized");

  const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
  if (!circle) throw new Error("Circle not found");

  const members = await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.status, "accepted")));
  const isMember = members.some(m => m.userId === user.id);
  if (!isMember) throw new Error("Not a member");

  const approvedBy = circle.approvedBy || [];
  const rejectedBy = circle.rejectedBy || [];

  if (approvedBy.includes(user.id) || rejectedBy.includes(user.id)) {
     throw new Error("You have already voted on this update");
  }

  let updatedApprovedBy = [...approvedBy];
  let updatedRejectedBy = [...rejectedBy];

  if (vote === "approve") {
    updatedApprovedBy.push(user.id);
  } else {
    updatedRejectedBy.push(user.id);
  }

  // Organizer is counted as supporting the vote automatically (+1)
  const yesVotes = updatedApprovedBy.length + 1; 
  const noVotes = updatedRejectedBy.length;
  const totalVotesCount = members.length;

  // Majority condition: votes strictly greater than half of members
  const majority = Math.floor(members.length / 2) + 1;

  const updates: any = {
    approvedBy: updatedApprovedBy,
    rejectedBy: updatedRejectedBy
  };

  if (yesVotes >= majority) {
    if (circle.pendingName) updates.name = circle.pendingName;
    if (circle.pendingContributionAmount) updates.contributionAmount = circle.pendingContributionAmount;
    updates.pendingName = null;
    updates.pendingContributionAmount = null;
    updates.approvedBy = null;
    updates.rejectedBy = null;
  } else if (noVotes >= majority) {
    updates.pendingName = null;
    updates.pendingContributionAmount = null;
    updates.approvedBy = null;
    updates.rejectedBy = null;
  }

  await db.update(circles).set(updates).where(eq(circles.id, circleId));
  
  revalidatePath(`/dashboard/circles/${circle.slug || circleId}`);
  return { success: true };
}
