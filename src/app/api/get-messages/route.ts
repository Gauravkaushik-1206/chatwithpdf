import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    const { chatId } = await req.json();
     const _messages = await db.select().from(messages).where(eq(messages.chatId, chatId));
    return Response.json(_messages,)

}