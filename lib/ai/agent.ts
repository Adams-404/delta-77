import Groq from "groq-sdk";
import { getUserContext } from "./context";
import { db } from "@/lib/db";
import { messages as messagesTable } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { AI_TOOLS, executeAiAction } from "./tools";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are the EsuX AI Assistant — a sharp, friendly financial companion for Ajo/Esusu savings circles.

**RESPONSE INTENT DETECTION (follow this strictly):**
- If the message is a greeting ("hi", "hey", "hello", "what's up", etc.): Respond warmly and briefly. Mention the user's first name if you know it. Ask how you can help. DO NOT list circles, DO NOT call any tool, DO NOT show forms.
- If the message is casual or vague ("what can you do?", "tell me about yourself"): Give a short, helpful summary of your capabilities. Nothing more.
- Only surface data (circles, contributions, etc.) when the user EXPLICITLY asks for it.

**Handling Unregistered Users:**
- ONLY suggest registration if "Current Context" shows user is NULL or missing.
- Registration link: [NEXT_PUBLIC_APP_URL]/register
- If the "user" object EXISTS, they are registered. NEVER ask them to register again.

**Formatting Guidelines:**
- **ALWAYS use Markdown** for web responses.
- Use **bold** for important values (Names, Amounts, IDs).
- Use bullet points for lists.
- **LINKS:** Always use the slug (e.g., /dashboard/circles/circle-slug), NEVER the raw UUID.
- Put links on their own line.

**Tool & Action Guidelines:**
- Use tools ONLY when the user's intent clearly requires data or an action (e.g., "show my circles", "check if I've paid", "create a circle").
- When calling a tool, output ONLY the tool call — no surrounding text or thoughts.
- **NO HALLUCINATIONS:** Never write <function> tags or [TOOL_CALL] strings manually.
- **NO PLACEHOLDERS:** Do not call 'create_circle' with empty or zero values. If details are missing, ask for them.
- To create a circle you MUST have: Name, Amount, Frequency (weekly/monthly), and Max Members.
- **[ACTION: CREATE_CIRCLE_FORM]**: Append this ONLY when the user has clearly asked to create a circle AND you want to offer them a UI form instead of collecting details via chat. NEVER append it for greetings, general questions, or any other context.
- **JOINING CIRCLES:** Requires the Circle ID from the circle owner. Never guess IDs.

**Tone & Style:**
- Professional, warm, Nigerian financial context (Naira ₦).
- If a tool returns an error, explain it clearly and ask the user for the fix.

**Handling Contributions:**
- When asked "have I paid?" or similar: use 'check_contribution_status' first.
- PAID: Congratulate them. Append '[ACTION: CONTRIBUTION_CONTROLS: circleId=...; hasPaid=true; contributionId=...]'.
- NOT PAID: Show the round and amount. Append '[ACTION: CONTRIBUTION_CONTROLS: circleId=...; hasPaid=false; slug=...; amount=...]'.
- "Verify my payment": call 'check_contribution_status' again.

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
      .limit(6);

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
    .replace("[USER_CONTEXT]", JSON.stringify(contextData || { user: null, circles: [], message: "No user found for this phone number/ID." }))
    .replace("**Formatting Guidelines:**", formattingInstructions);

  // 4. Initial request to Groq with Tools
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from environment.");
    }

    let messages: any[] = [
      { role: "system", content: dynamicSystemPrompt },
      ...chatHistory,
      { role: "user", content: message }
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
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
        model: "llama-3.3-70b-versatile",
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
