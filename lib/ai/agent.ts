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

**Formatting Guidelines:**
- **ALWAYS use Markdown** to make your responses professional.
- Use **bold text** for important values (IDs, Names, Amounts).
- Use **bullet points** for lists of details or steps.
- **LINKS:** When providing a link to a circle, ALWAYS use the **slug** (e.g., /dashboard/circles/circle-name-id), NEVER the unique ID. Using the ID in the link will cause a 404 error.
- Put links on their own line for visibility.

**Action Guidelines:**
- If a user wants to create a circle, YOU MUST COLLECT: Name, Amount, Frequency (weekly/monthly), and Max Members.
- If you are missing any of these details, DO NOT call 'create_circle' yet. Instead, ask the user for the missing info.
- **RICH UI:** You can trigger a form by appending '[ACTION: CREATE_CIRCLE_FORM]' at the end of your response if many details are missing.
- If a user wants to join a circle, they MUST provide the **Circle ID**. Circles are private; explain that they must get the unique ID from the circle owner to join.
- NEVER search for circles or guess IDs like '123' or 'ABC'. Ask the user to provide it.

**Tone & Style:**
- Be professional, polite, and use Nigerian financial context (Naira ₦).
- Explain what you are doing. If a tool returns an error, explain it and ask for the fix.

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
    .replace("[USER_CONTEXT]", JSON.stringify(contextData || "No active circles found. User might be new."))
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
