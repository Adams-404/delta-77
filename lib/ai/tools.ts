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
  rounds as roundsTable
} from "@/lib/db/schema";
import { eq, or, and, desc } from "drizzle-orm";

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
      description: "Join an existing savings circle. Requires a valid Circle ID. If the user doesn't have an ID, use search_circles first.",
      parameters: {
        type: "object",
        properties: {
          circleId: { type: "string", description: "The unique ID of the circle to join. NEVER guess this ID; if unknown, ask the user to provide it." }
        },
        required: ["circleId"]
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
      description: "Check if the user has already made a contribution for the current active round of a specific circle. Returns status and payment details if found.",
      parameters: {
        type: "object",
        properties: {
          circleIdOrSlug: { type: "string", description: "The ID or Slug of the circle to check." }
        },
        required: ["circleIdOrSlug"]
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

        // 1. Find Circle
        let circle: any;
        const [bySlug] = await db.select().from(circlesTable).where(eq(circlesTable.slug, args.circleIdOrSlug));
        circle = bySlug;
        if (!circle) {
          const [byId] = await db.select().from(circlesTable).where(eq(circlesTable.id, args.circleIdOrSlug));
          circle = byId;
        }
        if (!circle) return { error: "Circle not found." };

        // 2. Find Current Round
        const ongoingRounds = await db
          .select()
          .from(roundsTable)
          .where(
            and(
              eq(roundsTable.circleId, circle.id),
              eq(roundsTable.status, "ongoing")
            )
          );
        
        let currentRound = ongoingRounds[0];

        if (!currentRound) {
          // Check if ANY rounds exist to see what round number we should be on
          const allRounds = await db
            .select()
            .from(roundsTable)
            .where(eq(roundsTable.circleId, circle.id))
            .orderBy(desc(roundsTable.roundNumber));
          
          if (allRounds.length === 0) {
            // No rounds yet, so we're starting Round 1
            return {
              circleName: circle.name,
              circleSlug: circle.slug,
              circleId: circle.id,
              amount: circle.contributionAmount,
              roundNumber: 1,
              hasPaid: false,
              status: "ready_to_start",
              message: "The first round hasn't technically started yet, but you can kick it off with your first contribution!"
            };
          } else {
            // Previous rounds exist, we are transitioning to the next one
            const nextRoundNum = allRounds[0].roundNumber + 1;
            return {
              circleName: circle.name,
              circleSlug: circle.slug,
              circleId: circle.id,
              amount: circle.contributionAmount,
              roundNumber: nextRoundNum,
              hasPaid: false,
              status: "between_rounds",
              message: `Round #${allRounds[0].roundNumber} is finished. You can contribute now to start Round #${nextRoundNum}!`
            };
          }
        }

        // 3. Find Contribution
        const [contribution] = await db
          .select()
          .from(contributionsTable)
          .where(
            and(
              eq(contributionsTable.roundId, currentRound.id),
              eq(contributionsTable.memberId, effectiveUserId),
              eq(contributionsTable.paymentVerified, true)
            )
          );

        return {
          circleName: circle.name,
          circleSlug: circle.slug,
          circleId: circle.id,
          amount: circle.contributionAmount,
          roundNumber: currentRound.roundNumber,
          hasPaid: !!contribution,
          contributionId: contribution?.id || null,
          paidAt: contribution?.paidAt || null,
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
