"use client";

import {
  useState,
  useRef,
  useEffect,
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Send, ChevronLeft, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import Textarea from "react-textarea-autosize";
import LoadingSpinner from "./ui/LoadingSpinner";

interface AIChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  placeInfo: {
    name: string;
    address: string;
    description?: string | null;
    ai_recommendations?: any | null;
  };
}

export default function AIChatSheet({
  isOpen,
  onClose,
  placeInfo,
}: AIChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setSessionId(uuidv4());
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !placeInfo) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        generated_form: placeInfo.ai_recommendations,
        query: currentInput,
        session_id: sessionId,
      };
      const response = await axios.post("/api/form_chat", payload);
      const data = response.data;
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.final_answer,
        citations: data.hallu_check?.cited_chunks || [],
        createdAt: new Date(),
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "죄송합니다. 답변을 생성하는 동안 오류가 발생했습니다.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white z-40 flex flex-col",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
      <div className="p-4 border-b flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={onClose}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 text-center mx-4">
          <h3 className="font-bold text-lg">{placeInfo.name}</h3>
          <p className="text-sm text-gray-600 truncate">{placeInfo.address}</p>
        </div>
        <div className="w-10 h-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 여행지 정보 요약 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="mr-4 flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">
              {placeInfo.name}
            </h4>
            <p className="text-sm text-blue-700">{placeInfo.address}</p>
            {placeInfo.description && (
              <p className="text-xs text-blue-600 mt-1">
                {placeInfo.description}
              </p>
            )}
          </div>
        </div>

        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            AI에게 이 여행지에 대해 무엇이든 물어보세요!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div
              className={cn(
                "p-3 rounded-lg max-w-[85%]",
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              )}>
              <MarkdownRenderer content={msg.content} />
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <div className="p-3 rounded-lg bg-gray-100">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-lg border bg-gray-50 p-1.5">
          <Textarea
            placeholder="AI에게 무엇이든 물어보세요..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none border-none bg-transparent py-2 px-3 focus-visible:ring-0 shadow-none"
            disabled={isLoading}
            rows={1}
            maxRows={5}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
