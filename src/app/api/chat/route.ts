// import {Configuration, OpenAIApi} from "openai-edge";
// import {  } from 'ai';
// import { OpenAIStream, StreamingTextResponse } from "ai"
// export const runtime = "edge";

// const config = new Configuration({
//     apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

// export async function POST(req: Request) {
//     try {
//         const { messages } = await req.json();
//         const response = await openai.createChatCompletion({
//             model: "gpt-3.5-turbo",
//             messages: messages,
//             stream: true,
//         })
//         const stream = OpenAIStream(response);
//         return new StreamingTextResponse(stream);
//     } catch (error) {

//     }
// }

// import { google } from "@ai-sdk/google";
// import { streamText, StreamTextResult } from "ai";
// export const runtime = "edge";

// export async function POST(req: Request) {
//   const { messages } = await req.json();
//   console.log("Messages: ", messages);

//   // Use streamText to get a streaming response
//   try {
//     const result = streamText({
//       model: google("gemini-1.5-pro-latest"),
//       messages: messages,
//     });
//     //   console.log("Response: ", stream);

//     console.log("Result: ", result.toDataStreamResponse());
//     return result.toDataStreamResponse();
//   } catch (error) {
//     console.error("Error in POST request:", error);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }

// import { openai } from "@ai-sdk/openai";
// import { streamText } from "ai";

// export async function POST(req: Request) {
//   const { messages } = await req.json();

//   // Use streamText to get a streaming response
//   const stream = streamText({
//     model: openai("gpt-4o"),
//     messages: messages,
//   });

//   return stream.toDataStreamResponse();
// }

// import { GoogleGenAI } from "@google/genai";
// import { streamText, StreamTextResult } from "ai";
// import { nanoid } from "nanoid";
// import { StreamingTextResponse } from "ai";

// export const runtime = "edge";

// const genAI = new GoogleGenAI({
//   apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
// });

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();

//     // Convert messages to Gemini history
//     const history = messages.slice(0, -1).map((msg: any) => ({
//       role: msg.role === "user" ? "user" : "model",
//       parts: [{ text: msg.content }],
//     }));

//     const latest = messages[messages.length - 1];

//     const chat = genAI.chats.create({
//       model: "gemini-1.5-flash",
//       history,
//     });

//     const asyncGenerator = await chat.sendMessageStream({
//       message: latest.content,
//     });

//     // Send it back to useChat()
//     // Convert AsyncGenerator to ReadableStream
//     const stream = new ReadableStream({
//       async pull(controller) {
//         const { value, done } = await asyncGenerator.next();
//         if (done) {
//           controller.close();
//         } else if (
//           value &&
//           value.candidates &&
//           value.candidates[0]?.content?.parts
//         ) {
//           // Extract text from Gemini response
//           const text = value.candidates[0].content.parts
//             .map((p: any) => p.text)
//             .join("");
//           controller.enqueue(text);
//         }
//       },
//     });

//     // Return a Response using streamText
//     return new Response(stream, {
//       status: 200,
//       headers: { "Content-Type": "text/plain; charset=utf-8" },
//     });
//   } catch (err) {
//     console.error("Gemini error:", err);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }

import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { Message } from "@ai-sdk/react";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
// export const runtime = "edge";
const model = google("gemini-1.5-flash-8b");

export async function POST(req: NextRequest) {
  try {
    const { messages, chatId } = await req.json();
    // console.log(messages);
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }

    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `,
    };

    const onStart = async ()=>{
      await db.insert(_messages).values({
        chatId,
        content: lastMessage.content,
        role: "user",
      })
    }
    onStart();

    const result = streamText({
      model: model,
      system: "You are a helpful assistant.",
      // prompt: messages[messages.length-1].content,
      messages: [
        prompt,
        ...messages.filter((message: Message) => message.role === "user"),
      ],
      onFinish: async (result) => {
        console.log("AI response:", result.text);
        await db.insert(_messages).values({
          chatId: chatId,
          content: result.text,
          role: "system",
        });
      }
    });

    // for await (const textPart of result.textStream) {
    //   console.log(textPart); // Confirms streaming works in backend
    // }

    return result.toDataStreamResponse(); // Returns the response
  } catch (error) {
    console.error(error);
    return new NextResponse("Error processing request", { status: 500 });
  }
}
