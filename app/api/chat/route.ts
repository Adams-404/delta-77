import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages as messagesTable } from "@/lib/db/schema";
import { processBotMessage } from "@/lib/ai/agent";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const user = session.user as any;
    const userId = user.id;

    // 1. Save user message to DB
    try {
      await db.insert(messagesTable).values({
        id: crypto.randomUUID(),
        userId: userId,
        role: "user",
        content: message,
        channel: "web",
      });
    } catch (insertError: any) {
      console.error("DB Insert Error (User Message):", insertError);
      // Continue anyway or handle error
    }

    // 2. Process message with AI Agent
    const responseText = await processBotMessage({
      userId: userId,
      phoneNumber: user.phoneNumber || "",
      message: message,
      channel: "web",
    });

    // 3. Save assistant message to DB
    try {
      await db.insert(messagesTable).values({
        id: crypto.randomUUID(),
        userId: userId,
        role: "assistant",
        content: responseText,
        channel: "web",
      });
    } catch (insertError: any) {
      console.error("DB Insert Error (Bot Message):", insertError);
    }

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Chat API Detailed Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message 
    }, { status: 500 });
  }
}
