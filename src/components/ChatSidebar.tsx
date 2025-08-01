"use client";
import { DrizzleChat } from "@/lib/db/schema"
import Link from "next/link";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import SubscriptionButton from "./SubscriptionButton";

type props = {
    chats: DrizzleChat[],
    chatid: number,
    isPro?: boolean
}
export default function ChatSidebar({chats, chatid, isPro}: props) {
    
    return (
        <div className="w-full h-screen p-4 text-gray-200 bg-gray-900">
             <Link href="/">
                <Button className="w-full border-dashed border-white border ">
                    <PlusCircle className="mr-2 w-4 h-4"/>
                    New Chat
                </Button>
             </Link>

             <div className="flex flex-col gap-2 mt-4">
                {chats.map((chat)=>(
                    <Link key={chat.id} href={`/chat/${chat.id}`}>
                        <div className={
                            cn("rounded-lg p-3 text-slate-300 flex items-center", {
                                "bg-blue-800 text-white": chat.id === chatid,
                                "hover:text-white": chat.id !== chatid,
                            })
                        }>
                            <MessageCircle className="mr-2"></MessageCircle>
                            <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis">{chat.pdfName}</p>
                        </div>
                    </Link>
                ))}
             </div>

             <div className="absolute bottom-4 left-4">
                 <div className="flex itmes-center gap-2 text-sm text-slate-500 flex-wrap">
                    <Link href='/'>Home</Link>
                    <Link href='/'>Source</Link>
                    {/* stripe Button */}
                 </div>
                 <SubscriptionButton isPro={isPro ?? false}></SubscriptionButton>
             </div>
        </div>
    )
}