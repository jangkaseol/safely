"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ChevronLeft } from "lucide-react" // Send 아이콘 임포트 추가
import { cn } from "@/lib/utils"

interface AIChatSheetProps {
  isOpen: boolean
  onClose: () => void
  placeInfo: {
    name: string
    address: string
    description?: string | null
  }
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function AIChatSheet({ isOpen, onClose, placeInfo }: AIChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (input.trim() === "") return

    const userMessage: Message = { role: "user", content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          placeInfo: placeInfo, // AI에게 장소 정보 전달
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]) // 빈 AI 메시지 추가

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantResponse += chunk
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage && lastMessage.role === "assistant") {
            return [...prev.slice(0, -1), { ...lastMessage, content: assistantResponse }]
          }
          return prev
        })
      }
    } catch (error) {
      console.error("Error sending message to AI:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "죄송합니다. AI 응답을 가져오는 데 실패했습니다." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white z-40 flex flex-col",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full",
      )}
    >
      {/* Header with close button and place info */}
      <div className="p-4 border-b flex items-center justify-between">
        {/* 뒤로 가기 버튼 (왼쪽) */}
        <Button variant="outline" size="icon" onClick={onClose}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        {/* 여행지 정보 (중앙) */}
        <div className="flex-1 text-center mx-4">
          <h3 className="font-bold text-lg">{placeInfo.name}</h3>
          <p className="text-sm text-gray-600 truncate">{placeInfo.address}</p>
        </div>
        {/* 빈 공간 (오른쪽 균형을 위해) */}
        <div className="w-10 h-10"></div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 여행지 정보 요약 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={onClose}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 ml-3">
            <h4 className="font-semibold text-blue-800 mb-1">{placeInfo.name}</h4>
            <p className="text-sm text-blue-700">{placeInfo.address}</p>
            {placeInfo.description && <p className="text-xs text-blue-600 mt-1">{placeInfo.description}</p>}
          </div>
        </div>

        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">AI에게 이 여행지에 대해 무엇이든 물어보세요!</div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg max-w-[80%]",
              msg.role === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-200 text-gray-800 mr-auto",
            )}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-lg bg-gray-200 text-gray-800 mr-auto">AI가 답변을 생성 중입니다...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t flex items-center gap-2">
        <Input
          placeholder="AI에게 질문하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
