import ChatComponent from "@/components/ChatComponent";
import ChatSidebar from "@/components/ChatSidebar";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ChatPage({params}: {params: Promise<{ chatid: string }>}) {
    const { chatid } = await params
    const { userId } = await auth();

    if(!userId){
        return redirect('/sign-in');
    }

    const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
    if(!_chats){
        return redirect('/')
    } 

    if(!_chats.find((chat)=>chat.id === parseInt(chatid))){
        return redirect('/');
    }

    const currentChat = _chats.find((chat) => chat.id === parseInt(chatid));

    return (
        <div className="flex max-h-screen overflow-scroll">
            <div className="flex w-full max-h-screen overflow-scroll">
                {/* chat sidebar */}
                <div className="flex-[1] max-w-xs">
                    <ChatSidebar chats={_chats} chatid={parseInt(chatid)} />

                </div>
                {/* pdf viewer */}
                <div className="max-h-screen overflow-scroll p-4 flex-[5]">
                    <PDFViewer pdf_url={currentChat?.pdfUrl || ""}/>
                </div>
                {/* chat messages */}
                <div className="flex-[3] border-l-4 border-l-slate-200">
                    <ChatComponent chatId={parseInt(chatid)}/>
                </div>
            </div>
        </div>
    )
}