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
   - **NO EXTERNAL LINKS:** NEVER provide links to Paystack, Flutterwave, or any other external payment gateway yourself. You are strictly forbidden from guessing or generating payment URLs. If 'check_contribution_status' fails, ask the user for the correct Circle name.
   - **VERIFICATION:** When a user says they've paid or asks to "verify" their contribution, ALWAYS call 'check_contribution_status' for that circle to confirm if the payment is reflected in the system.
   - **General Status:** Use 'check_all_my_contributions_summary' for general inquiries.

4. [FORMATTING_GUIDELINES]


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
    .replace("[FORMATTING_GUIDELINES]", formattingInstructions);

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

      return formatResponseForChannel(finalResponse.choices[0].message.content || "", channel);
    }

    return formatResponseForChannel(responseMessage.content || "I'm sorry, I couldn't process that.", channel);
  } catch (error: any) {
    console.error("Groq Agent Error:", error);
    if (error.status === 429) return "I'm thinking too fast! Please wait a moment. ⚡";
    return "Something went wrong with my logic. Please try again.";
  }
}

/**
 * Formats the AI response based on the channel (Web or WhatsApp).
 * For WhatsApp, it converts Markdown bold to WhatsApp bold and cleans up action tags.
 */
function formatResponseForChannel(text: string, channel: "web" | "whatsapp"): string {
  if (channel === "web") return text;

  return text
    // 1. Convert Markdown Bold (**text**) to WhatsApp Bold (*text*)
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    // 2. Handle Quick Replies for WhatsApp - convert pipe-separated actions into a list
    .replace(/\[ACTION: QUICK_REPLIES: ([^\]]+)\]/gi, (_, items) => {
      const list = items.split("|").map((i: string) => `• ${i.trim()}`).join("\n");
      return `\n*Try typing one of these:*\n${list}`;
    })
    // 3. Handle Payment Action tags for WhatsApp - make them readable prompts + provide links
    .replace(/\[ACTION: CONTRIBUTION_CONTROLS:[^\]]*slug=([^;\]]+); amount=([^;\]]+)?[^\]]*\]/gi, (match, slug, amount) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://esux.vercel.app";
      const url = `${baseUrl}/dashboard/circles/${slug}`;
      return `*Payment Needed:* ${amount ? "₦" + amount : "Contribution"}\nLink to pay securely: ${url}\n\n(After paying, reply with "I've paid" or "check now" for me to verify your payment status)`;
    })
    // 4. Handle remaining Action tags for WhatsApp - make them readable prompts
    // Example: "[ACTION: ...] (confirm)" -> "type *confirm*"
    .replace(/\[ACTION:[^\]]*\]\s*\(([^)]+)\)/gi, (_, label) => `type "*${label}*"`)
    // 5. Remove any remaining raw action tags
    .replace(/\[ACTION:[^\]]*\]/g, "")
    // 6. Flatten triple line breaks
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
