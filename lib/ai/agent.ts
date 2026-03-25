import Groq from "groq-sdk";
import { getUserContext } from "./context";
import { db } from "@/lib/db";
import { messages as messagesTable } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are the EsuX AI Assistant, a helpful and smart financial companion for West African community savings circles (Ajo/Esusu).
Your goal is to help users manage their savings, track contributions, and ensure everyone stays accountable.

**Guidelines:**
- Be professional, polite, and culturally aware (Nigerian context).
- Use local terms when appropriate (Naira, Ajo, Payout, Round).
- If a user asks about their circles, use the context provided to answer accurately.
- If a user wants to create a circle, ask for: name, contribution amount, frequency (weekly/monthly), and max members.
- If you can't satisfy a request yet, explain that EsuX is still in beta and you'll notify them when the feature is ready.
- Keep responses concise for WhatsApp (avoid long paragraphs). 
- Use formatting (bold, bullet points) to make it readable.
- If the user is unauthenticated, encourage them to sign up at esux.app.

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

  // 1. Fetch user data if we have a userId
  let context = null;
  try {
    if (userId) {
      context = await getUserContext(userId);
    }
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
      .limit(8); // Grab last 8 messages for context

    chatHistory = history.reverse().map(h => ({
      role: h.role === "assistant" ? "assistant" as const : "user" as const,
      content: h.content
    }));
  } catch (histError) {
    console.error("History Fetch Error:", histError);
  }

  // 3. Construct System Prompt with Context
  const dynamicSystemPrompt = SYSTEM_PROMPT
    .replace("[USER_CONTEXT]", JSON.stringify(context || "No active circles or history found. User might be new."));

  // 4. Generate Response using Groq (Llama 3.3 70B)
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from environment.");
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: dynamicSystemPrompt },
        ...chatHistory,
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Groq Agent Error:", error);
    
    // Check for rate limits and return a friendly message
    if (error.status === 429) {
      return "I'm thinking too fast right now! ⚡ Please wait a few seconds and try again. (Groq Rate Limit Hit)";
    }

    return "I'm having a technical glitch. Please try again in a moment.";
  }
}
