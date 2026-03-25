import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
});

export async function generateResponse(prompt: string, history: { role: "user" | "model", parts: { text: string }[] }[] = []) {
  const chat = model.startChat({
    history,
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  return response.text();
}
