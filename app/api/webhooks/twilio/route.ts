import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable, messages as messagesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { twilioClient } from "@/lib/twilio";
import { processBotMessage } from "@/lib/ai/agent";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const body = formData.get("Body") as string;
    const from = formData.get("From") as string; // format: "whatsapp:+1234567890"
    const phoneNumber = from.replace("whatsapp:", "");

    console.log(`Received WhatsApp message from ${phoneNumber}: ${body}`);

    // 1. Identify User
    let [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.phoneNumber, phoneNumber));

    // 2. Save incoming message to DB
    await db.insert(messagesTable).values({
      id: crypto.randomUUID(),
      userId: user?.id,
      phoneNumber: phoneNumber,
      role: "user",
      content: body,
      channel: "whatsapp",
    });

    // 3. Process message with Gemini Agent
    const responseText = await processBotMessage({
      userId: user?.id,
      phoneNumber: phoneNumber,
      message: body,
      channel: "whatsapp",
    });

    // 4. Send response via Twilio
    await twilioClient.messages.create({
      body: responseText,
      from: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
      to: from,
    });

    // 5. Save bot message to DB
    await db.insert(messagesTable).values({
      id: crypto.randomUUID(),
      userId: user?.id,
      phoneNumber: phoneNumber,
      role: "assistant",
      content: responseText,
      channel: "whatsapp",
    });

    // Return TwiML response
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
