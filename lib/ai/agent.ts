import Groq from "groq-sdk";
import { getUserContext } from "./context";
import { db } from "@/lib/db";
import { messages as messagesTable } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { AI_TOOLS, executeAiAction } from "./tools";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are the EsuX AI — a high-performance financial assistant. 

**CORE STYLING RULE:**
- **CURRENCY:** You MUST ONLY use **₦ (Naira)** for ALL amounts. NEVER use $.
- **CORRECT:** ₦5,000.00
- **INCORRECT:** $5,000.00, 5000 Naira.

**CORE RULES (DO NOT DEVIATE):**
1. **Response Intent:** 
   - Greeting ("hi", "hey"): Respond warmly: "Hello [Name]! How can I help you today?" Append the Full Capabilities quick replies.
   - WhatsApp ("Chat on WhatsApp"): DO NOT call any tool. Respond: "Send 'join got-due' to +1 (415) 523-8886. [Link: https://wa.me/14155238886?text=join%20got-due]"
   - Data Request: ONLY list circles or summary if explicitly asked.
   - Creating/Starting Circle: ONLY show the [ACTION: CREATE_CIRCLE_FORM] if intent is exactly "create/start a new circle".

2. **Full Capabilities (Use only on Greeting or "What can you do?"):**
   [ACTION: QUICK_REPLIES: Show my circles | Create a new circle | Join a circle | Get financial summary | Check contribution status | Chat on WhatsApp]

3. **Contribution & Payment Workflow:**
   - **PAY/CONTRIBUTE Intent:** Always call 'check_contribution_status' for the target circle.
   - **Action Tags (STRICT SYNTAX - NO SPACES INSIDE BRACKETS):**
     - Correct: [ACTION: CONTRIBUTION_CONTROLS: circleId=...; hasPaid=true; slug=...; amount=...]
     - Error-Avoidance: Do NOT put spaces before "ACTION" or after the closing bracket.
   - **NO HALLUCINATIONS:** Never say "success" unless 'hasPaid: true' is returned by the tool.
   - **General Status:** Use 'check_all_my_contributions_summary' for general inquiries.

4. **Formatting:** Use **bold** for amounts and names. Use Markdown lists. Links on new lines. ONLY use ₦ (Naira).

**Current Context:**
[USER_CONTEXT]
`;

export async function processBotMessage(params: {
  userId?: string,
  phoneNumber: string,
  message: string,
  channel: "web" | "whatsapp"
}) {
  const { userId, phoneNumber, message, channel } = params;

  // 1. Fetch user data
  let contextData = null;
  try {
    contextData = await getUserContext(userId, phoneNumber);
  } catch (ctxError) {
    console.error("Context Fetch Error:", ctxError);
  }

  // 2. Fetch recent chat history from DB
  let chatHistory: any[] = [];
  try {
    const history = await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.channel, channel),
          userId ? eq(messagesTable.userId, userId) : eq(messagesTable.phoneNumber, phoneNumber)
        )
      )
      .orderBy(desc(messagesTable.createdAt))
      .limit(4);

    chatHistory = history.reverse().map(h => ({
      role: h.role === "assistant" ? "assistant" as const : "user" as const,
      content: h.content
    }));
  } catch (histError) {
    console.error("History Fetch Error:", histError);
  }

  // Formatting instructions for different channels
  const formattingInstructions = channel === "whatsapp"
    ? `**WhatsApp Formatting:**
- Use *bold* for emphasis (Naira amounts, Names, IDs).
- Use _italics_ for secondary info.
- Use lists with bullet points but KEEP THEM FLAT (no deep indents).
- DO NOT use Markdown links like [Text](Url). WhatsApp doesn't support them.
- Put important URLs on their own line.
- Use emojis naturally to keep it friendly.`
    : `**Web Formatting:**
- ALWAYS use standard Markdown.
- Use **bold text** for important values.
- Use bullet points for lists.
- For links, ALWAYS use the slug (e.g., /dashboard/circles/slug).`;

  // 3. Construct System Prompt with Context
  const dynamicSystemPrompt = SYSTEM_PROMPT
    .replace("[USER_CONTEXT]", JSON.stringify({
      user: contextData?.user || null,
      circles: contextData?.circles?.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, amount: c.contributionAmount, freq: c.frequency })) || [],
      rounds: contextData?.rounds?.map((r: any) => ({ id: r.id, circleId: r.circleId, num: r.roundNumber })) || [],
      message: contextData ? undefined : "No user found for this phone number/ID."
    }))
    .replace("**Formatting Guidelines:**", formattingInstructions);

  // 4. Initial request to Groq with Tools
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from environment.");
    }

    let messages: any[] = [
      { role: "system", content: dynamicSystemPrompt + "\n\nCRITICAL: Be extremely concise to save tokens. Only provide necessary info." },
      ...chatHistory,
      { role: "user", content: message }
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-8b-instant",
      tools: AI_TOOLS as any,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // 5. Check if the model wants to call a tool
    if (responseMessage.tool_calls) {
      messages.push(responseMessage); // Add the model's call to history

      for (const toolCall of responseMessage.tool_calls) {
        const result = await executeAiAction(toolCall, { userId, phoneNumber });

        // Add the tool result to history
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Get a final response from the model after tool execution
      const finalResponse = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
      });

      return finalResponse.choices[0].message.content || "";
    }

    return responseMessage.content || "I'm sorry, I couldn't process that.";
  } catch (error: any) {
    console.error("Groq Agent Error:", error);
    if (error.status === 429) return "I'm thinking too fast! Please wait a moment. ⚡";
    return "Something went wrong with my logic. Please try again.";
  }
}
