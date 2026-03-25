import { 
  createCircleCore, 
  listUserCirclesCore, 
  getCircleDetailsCore, 
  searchCirclesCore,
  joinCircleCore 
} from "@/app/actions/circles";
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
    switch (name) {
      case "create_circle": {
        if (!context.userId) return { error: "User not authenticated. I need you to sign in first." };
        
        const required = ["name", "amount", "frequency", "maxMembers"];
        const missing = required.filter(field => !args[field]);
        
        if (missing.length > 0) {
          return { 
            error: `Missing required information: ${missing.join(", ")}.`,
            instruction: "Please ask the user for these specific details. You can suggest they use the Circle Creation Form."
          };
        }

        const newCircle = await createCircleCore(context.userId, {
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
        if (!context.userId) return { error: "User not identified. Please register or log in." };
        return await listUserCirclesCore(context.userId);

      case "get_circle_details":
        if (!args.circleIdOrSlug) return { error: "I need a Circle ID or Slug to get details." };
        return await getCircleDetailsCore(args.circleIdOrSlug);


      case "join_circle": {
        if (!context.userId) return { error: "User not authenticated." };
        if (!args.circleId) return { error: "Circle ID is required to join." };
        
        // Check if it's a dummy ID
        if (args.circleId.includes("id_of") || args.circleId === "123") {
          return { error: "I don't have the real Circle ID yet. Please ask the user to provide the exact Circle ID from the owner." };
        }

        return await joinCircleCore(context.userId, args.circleId);
      }

      case "get_financial_summary":
        if (!context.userId) return { error: "User not identified." };
        const contributions = await db.select().from(contributionsTable).where(eq(contributionsTable.memberId, context.userId));
        const totalSaved = contributions.length > 0 ? contributions.reduce((sum, c) => sum + parseFloat(c.amountPaid), 0) : 0;
        return { totalSaved, contributionCount: contributions.length };

      default:
        return { error: "Unknown action" };
    }
  } catch (error: any) {
    console.error(`Error executing ${name}:`, error);
    return { error: `Command failed: ${error.message || "Unknown error"}` };
  }
}
