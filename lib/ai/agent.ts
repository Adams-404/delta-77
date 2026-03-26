import Groq from "groq-sdk";
import { getUserContext } from "./context";
import { db } from "@/lib/db";
import { messages as messagesTable } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { AI_TOOLS, executeAiAction } from "./tools";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are the EsuX AI Assistant, a helpful and smart financial companion.
Your goal is to help users manage their savings (Ajo/Esusu), track contributions, and coordinate with members.

**Handling Unregistered Users:**
- ONLY suggest registration if the "Current Context" indicates NO user is found (user is NULL or missing).
- Registration link: [NEXT_PUBLIC_APP_URL]/register
- If the "user" object EXISTS, they are already registered and verified. NEVER ask them to register or verify again. Just help them with their circles.

**Formatting Guidelines:**
- **ALWAYS use Markdown** to make your responses professional.
- Use **bold text** for important values (IDs, Names, Amounts).
- Use **bullet points** for lists of details or steps.
- **LINKS:** When providing a link to a circle, ALWAYS use the **slug** (e.g., /dashboard/circles/circle-name-id), NEVER the unique ID. Using the ID in the link will cause a 404 error.
- Put links on their own line for visibility.

**Action Guidelines:**
- **TOOL CALLING:** When you need information (like contribution status) or to perform an action (like join or create a circle), use the provided tools. 
- **CRITICAL:** When calling a tool, DO NOT include any regular text or "thoughts" in your response. ONLY provide the tool call.
- **NO HALLUCINATIONS:** NEVER write function tags like <function> or tags like [TOOL_CALL]. Use the valid tool-calling mechanism.
- **NO PLACEHOLDERS:** If a user hasn't provided details (like name or amount), DO NOT call 'create_circle' with empty strings or 0. Instead, ask the user to provide the missing information.
- If a user wants to create a circle, YOU MUST COLLECT: Name, Amount, Frequency (weekly/monthly), and Max Members.
- If you are missing any of these details, ABORT the tool call and ask for the missing info.
- **JOINING CIRCLES:** If a user wants to join a circle, they MUST provide the **Circle ID**. Circles are private; explain that they must get the unique ID from the circle owner to join.
- NEVER search for circles or guess IDs like '123' or 'ABC'. Ask the user to provide it.
- **RICH UI:** You can trigger a form by appending '[ACTION: CREATE_CIRCLE_FORM]' at the end of your response ONLY if you are not calling another tool.

**Tone & Style:**
- Be professional, polite, and use Nigerian financial context (Naira ₦).
- Explain what you are doing. If a tool returns an error, explain it clearly and ask for the fix.
- **Handling Contributions:**
  - When a user asks "have I paid?" or wants to contribute, ALWAYS use 'check_contribution_status' first.
  - If they **HAVE PAID** for the current round: Congrats them! Offer to show the receipt. Append '[ACTION: CONTRIBUTION_CONTROLS: circleId=...; hasPaid=true; contributionId=...]' to provide the button.
  - If they **HAVE NOT PAID**: Explain they are due for Round #X. Show the amount. Append '[ACTION: CONTRIBUTION_CONTROLS: circleId=...; hasPaid=false; slug=...; amount=...]' to provide the payment and verify buttons.
  - If they say "Verify my payment", use 'check_contribution_status' again to see if it's now marked as paid in the DB.

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
