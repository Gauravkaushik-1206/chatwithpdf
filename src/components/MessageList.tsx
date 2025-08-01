import { cn } from "@/lib/utils";
import { Message } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
type props = {
  isLoading: boolean
  messages: Message[];
};
export default function MessageList({ messages, isLoading }: props) {
  if (isLoading){
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Loader2 className="w-6 h-8 animate-spin"></Loader2>
      </div>
    )
  }
  if (!messages || messages.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      {messages.map((message) => {
        return (
          <div
            key={message.id}
            className={cn("flex", {
              "justify-end pl-10": message.role === "user",
              "justify-start pr-10": message.role === "assistant",
            })}
          >
            <div
              className={cn(
                " rounded-lg text-sm px-3 py-1 shadow-md ring-1 ring-gray-900/10",
                {
                  "bg-blue-600 text-white": message.role === "user",
                }
              )}
            >
              <p>{message.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
