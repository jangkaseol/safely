import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export const runtime = "edge" // 빠른 응답을 위해 Edge Runtime 사용

export async function POST(req: Request) {
  const { messages, placeInfo } = await req.json()

  // AI에게 여행지 정보를 컨텍스트로 제공하는 시스템 프롬프트 구성
  const systemPrompt = `
    당신은 여행 안전 정보에 특화된 친절한 AI 어시스턴트입니다.
    사용자가 제공한 여행지 정보와 대화 기록을 바탕으로 질문에 답변해주세요.
    여행지 정보:
    이름: ${placeInfo.name}
    주소: ${placeInfo.address}
    ${placeInfo.description ? `설명: ${placeInfo.description}` : ""}

    이 여행지에 대한 안전, 관광, 교통 등 다양한 질문에 답변할 수 있습니다.
    항상 친절하고 유용한 정보를 제공해주세요.
  `.trim()

  const result = await streamText({
    model: openai("gpt-4o"), // gpt-4o 모델 사용
    system: systemPrompt,
    messages: messages,
  })

  return result.toResponse()
}
