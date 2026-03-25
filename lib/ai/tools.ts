import { createCircleCore } from "@/app/actions/circles";
import { db } from "@/lib/db";
import { contributions as contributionsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Definition of tools the AI Agent can use.
 * These are passed to Groq to enable "Action" capabilities.
 */
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_circle",
      description: "Create a new savings circle (Ajo/Esusu) for the user.",
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
      name: "get_financial_summary",
      description: "Get a summary of the user's current savings and active circles.",
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
  const args = JSON.parse(argsString);

  console.log(`🤖 AI ACTION TRIGGERED: ${name}`, args);

  switch (name) {
    case "create_circle":
      if (!context.userId) return { error: "User not authenticated" };
      return await createCircleCore(context.userId, {
        name: args.name,
        description: args.description || "",
        amount: args.amount,
        frequency: args.frequency,
        maxMembers: args.maxMembers
      });

    case "get_financial_summary":
      if (!context.userId) return { error: "User not identified" };
      const contributions = await db.select().from(contributionsTable).where(eq(contributionsTable.memberId, context.userId));
      const totalSaved = contributions.length > 0 ? contributions.reduce((sum, c) => sum + parseFloat(c.amountPaid), 0) : 0;
      return { totalSaved, contributionCount: contributions.length };

    default:
      return { error: "Unknown action" };
  }
}
