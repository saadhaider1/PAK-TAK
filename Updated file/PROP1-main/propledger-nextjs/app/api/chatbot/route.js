import OpenAI from "openai";
import { systemKnowledge } from "../../../components/ai-chatbot/knowledge/systemKnowledge";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { message, user } = await req.json();

    const userContext = user
      ? `
User Info:
- Name: ${user.name}
- Email: ${user.email}
- Type: ${user.type}
`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Propledger AI assistant.

${systemKnowledge}

${userContext}

Rules:
- Be helpful and short
- Guide user step-by-step
- Speak like a friendly assistant
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      reply: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "Something went wrong." });
  }
}