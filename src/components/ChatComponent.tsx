"use client";
import { Message, useChat } from "@ai-sdk/react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type props = {
  chatId: number
}

export default function ChatComponent({chatId}:props) {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {chatId})
      return response.data;
    }
  })
  const { messages, input, handleSubmit, handleInputChange } =
    useChat({
        api: "/api/chat",
        body: {
          chatId
        },
        initialMessages: data || [],
    });
    React.useEffect(() => {
      const messageContainer = document.getElementById("message-container");
      if(messageContainer){
        messageContainer.scrollTo({
          top: messageContainer.scrollHeight,
          behavior: "smooth"
        })
      }
    }, [messages]);

  return (
    <div className="relative max-h-screen overflow-scroll" id="message-container">
      {/* header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>
      {/* message list  */}
      <MessageList messages={messages} isLoading={isLoading}></MessageList>
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message here..."
            className="w-full"
          ></Input>
          <Button className="bg-blue-600 ml-2">
            <Send className="h-4 w-4"></Send>
          </Button>
        </div>
      </form>
    </div>
  );
}
