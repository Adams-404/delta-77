import {
  createCircleCore,
  listUserCirclesCore,
  getCircleDetailsCore,
  searchCirclesCore,
  joinCircleCore
} from "@/app/actions/circles";
import { db } from "@/lib/db/client";
import {
  contributions as contributionsTable,
  user as userTable,
  circles as circlesTable,
  rounds as roundsTable,
  circleMembers as circleMembersTable
} from "@/lib/db/schema";
import { eq, or, and, desc, ilike } from "drizzle-orm";

/**
 * Definition of tools the AI Agent can use.
 * These are passed to Groq to enable "Action" capabilities.
 */
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_circle",
      description: "Create a new savings circle (Ajo/Esusu) for the user. Returns the 'slug' which MUST be used for the dashboard link.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The name of the circle" },
          amount: { type: "string", description: "Contribution amount per period (e.g., 5000)" },
          frequency: { type: "string", enum: ["weekly", "monthly"], description: "How often contributions happen" },
          maxMembers: { type: "number", description: "Maximum number of participants" },
          description: { type: "string", description: "A brief description of the circle's purpose" }
        },
        required: ["name", "amount", "frequency", "maxMembers"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_my_circles",
      description: "List all savings circles the user is currently a member of.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_circle_details",
      description: "Get detailed information about a specific circle, including its members and status.",
      parameters: {
        type: "object",
        properties: {
          circleIdOrSlug: { type: "string", description: "The ID or the URL slug of the circle." }
        },
        required: ["circleIdOrSlug"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "join_circle",
      description: "ONLY use this if the user says they want to JOIN or JOINING a circle (e.g. 'I want to join the TEST circle'). NEVER use this for contributions or payments.",
      parameters: {
        type: "object",
        properties: {
          inviteCodeOrSlug: {
            type: "string",
            description: "The slug or invite code of the circle."
          }
        },
        required: ["inviteCodeOrSlug"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get a summary of the user's current savings and active circles.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_contribution_status",
      description: "Use this whenever the user wants to PAY, CONTRIBUTE, or CHECK STATUS for a specific circle (e.g. 'I want to pay for Groq', 'Status of Enyata'). Returns the payment buttons.",
      parameters: {
        type: "object",
        properties: {
          circleIdOrSlug: { type: "string", description: "The ID or Slug of the circle to check." }
        },
        required: ["circleIdOrSlug"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_all_my_contributions_summary",
      description: "Get a prioritized summary of all contributions for every circle the user is a member of. Use this for general inquiries like 'have I paid?' or 'what is my status?'.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

/**
 * Executes a tool called by the AI.
 */
export async function executeAiAction(toolCall: any, context: { userId?: string, phoneNumber: string }) {
  const { name, arguments: argsString } = toolCall.function;

  let args: any;
  try {
    args = JSON.parse(argsString);
  } catch (e) {
    return { error: "Invalid arguments format. Please provide valid JSON." };
  }

  console.log(`🤖 AI ACTION TRIGGERED: ${name}`, args);

  try {
    // Fallback: If userId is missing, try to find the user by phone number
    let effectiveUserId = context.userId;
    if (!effectiveUserId && context.phoneNumber) {
      const local = context.phoneNumber.slice(-10);
      const [dbUser] = await db
        .select()
        .from(userTable)
        .where(
          or(
            eq(userTable.phoneNumber, context.phoneNumber),
            eq(userTable.phoneNumber, `0${local}`),
            eq(userTable.phoneNumber, local)
          )
        );
      if (dbUser) effectiveUserId = dbUser.id;
    }

    const regMessage = `I couldn't find your account. Please register at ${process.env.NEXT_PUBLIC_APP_URL || "https://esux.vercel.app"}/register and verify your phone number there first!`;

    switch (name) {
      case "create_circle": {
        if (!effectiveUserId) return { error: regMessage };

        const required = ["name", "amount", "frequency", "maxMembers"];
        const missing = [];
        if (!args.name || args.name.trim() === "") missing.push("name");
        if (!args.amount || parseFloat(args.amount) <= 0) missing.push("amount (must be > 0)");
        if (!args.frequency) missing.push("frequency");
        if (!args.maxMembers || args.maxMembers <= 0) missing.push("maxMembers (must be at least 1)");

        if (missing.length > 0) {
          return {
            error: `Missing or invalid information: ${missing.join(", ")}.`,
            instruction: "Please ask the user for these specific details. Do not call this tool with empty or zero values."
          };
        }

        const newCircle = await createCircleCore(effectiveUserId, {
          name: args.name,
          description: args.description || "",
          amount: args.amount,
          frequency: args.frequency,
          maxMembers: args.maxMembers
        });

        return {
          ...newCircle,
          message: `Circle created! View it at /dashboard/circles/${newCircle.slug}`
        };
      }

      case "list_my_circles":
        if (!effectiveUserId) return { error: regMessage };
        return await listUserCirclesCore(effectiveUserId);

      case "get_circle_details":
        if (!args.circleIdOrSlug) return { error: "I need a Circle ID or Slug to get details." };
        return await getCircleDetailsCore(args.circleIdOrSlug);


      case "join_circle": {
        if (!effectiveUserId) return { error: regMessage };
        if (!args.circleId) return { error: "Circle ID is required to join." };

        // Check if it's a dummy ID
        if (args.circleId.includes("id_of") || args.circleId === "123") {
          return { error: "I don't have the real Circle ID yet. Please ask the user to provide the exact Circle ID from the owner." };
        }

        return await joinCircleCore(effectiveUserId, args.circleId);
      }

      case "get_financial_summary":
        if (!effectiveUserId) return { error: regMessage };
        const contributions = await db.select().from(contributionsTable).where(eq(contributionsTable.memberId, effectiveUserId));
        const totalSaved = contributions.length > 0 ? contributions.reduce((sum, c) => sum + parseFloat(c.amountPaid), 0) : 0;
        return { totalSaved, contributionCount: contributions.length };

      case "check_contribution_status": {
        if (!effectiveUserId) return { error: regMessage };
        if (!args.circleIdOrSlug) return { error: "I need a circle ID to check status." };

        // 1. Find Circle (Fuzzy/Robust match)
        let circle: any;
        const [bySlug] = await db.select().from(circlesTable).where(ilike(circlesTable.slug, args.circleIdOrSlug));
        circle = bySlug;
        if (!circle) {
          const [byId] = await db.select().from(circlesTable).where(eq(circlesTable.id, args.circleIdOrSlug));
          circle = byId;
        }
        if (!circle) {
          const [byName] = await db.select().from(circlesTable).where(ilike(circlesTable.name, args.circleIdOrSlug));
          circle = byName;
        }
        if (!circle) return { error: "Circle not found." };

        // 2. Find Current Round
        const ongoingRounds = await db.select().from(roundsTable).where(and(eq(roundsTable.circleId, circle.id), eq(roundsTable.status, "ongoing")));
        let currentRound = ongoingRounds[0];

        if (!currentRound) {
          return {
            circleName: circle.name,
            hasPaid: false,
            message: "No active round found for this circle.",
            actionTag: `[ACTION: CONTRIBUTION_CONTROLS: circleId=${circle.id}; hasPaid=false; slug=${circle.slug}; amount=${circle.contributionAmount}]`
          };
        }

        // 3. Find Contribution
        const [contribution] = await db.select().from(contributionsTable).where(and(eq(contributionsTable.roundId, currentRound.id), eq(contributionsTable.memberId, effectiveUserId), eq(contributionsTable.paymentVerified, true)));

        return {
          circleName: circle.name,
          amount: circle.contributionAmount,
          hasPaid: !!contribution,
          roundNumber: currentRound.roundNumber,
          deadline: currentRound.endsAt ? new Date(currentRound.endsAt).toLocaleDateString() : "No deadline set",
          actionTag: `[ACTION: CONTRIBUTION_CONTROLS: circleId=${circle.id}; hasPaid=${!!contribution}; slug=${circle.slug}; amount=${circle.contributionAmount}; contributionId=${contribution?.id || ""}]`
        };
      }

      case "check_all_my_contributions_summary": {
        if (!effectiveUserId) return { error: regMessage };

        // 1. Get all memberships for the user
        const memberships = await db.select().from(circleMembersTable).where(eq(circleMembersTable.userId, effectiveUserId));
        if (memberships.length === 0) return { message: "You are not a member of any circles yet." };

        const summary = [];
        for (const member of memberships) {
          const [circle] = await db.select().from(circlesTable).where(eq(circlesTable.id, member.circleId));
          if (!circle) continue;

          const ongoingRounds = await db.select().from(roundsTable).where(and(eq(roundsTable.circleId, circle.id), eq(roundsTable.status, "ongoing")));
          const currentRound = ongoingRounds[0];

          if (!currentRound) {
            summary.push({ name: circle.name, slug: circle.slug, status: "No active round", amount: circle.contributionAmount, hasPaid: false });
            continue;
          }

          const [contribution] = await db.select().from(contributionsTable).where(and(eq(contributionsTable.roundId, currentRound.id), eq(contributionsTable.memberId, effectiveUserId), eq(contributionsTable.paymentVerified, true)));

          summary.push({
            id: circle.id,
            name: circle.name,
            slug: circle.slug,
            amount: circle.contributionAmount,
            hasPaid: !!contribution,
            deadline: currentRound.endsAt || null,
            round: currentRound.roundNumber,
            // Pre-built tag so the AI doesn't have to guess or construct it
            actionTag: `[ACTION: CONTRIBUTION_CONTROLS: circleId=${circle.id}; hasPaid=${!!contribution}; slug=${circle.slug}; amount=${circle.contributionAmount}; contributionId=${contribution?.id || ""}]`
          });
        }

        // Sort by deadline (earliest first)
        summary.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        return {
          totalCircles: summary.length,
          allCircles: summary, // Return the full list for the AI to see
          summaryText: "I've checked all your circles. Here is the status prioritized by deadlines:",
          instruction: "CRITICAL: You MUST list EVERY circle found in 'allCircles'. For UNPAID circles, ALWAYS append the 'actionTag' provided for that circle. DO NOT write the tag yourself."
        };
      }

      default:
        return { error: "Unknown action" };
    }
  } catch (error: any) {
    console.error(`Error executing ${name}:`, error);
    return { error: `Command failed: ${error.message || "Unknown error"}` };
  }
}
