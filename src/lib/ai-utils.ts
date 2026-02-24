import type { AiResponse, HalluCitedChunk } from "@/lib/types";

interface ParsedAiRecommendations {
  generation: string | null;
  citedChunks: HalluCitedChunk[] | null;
}

/**
 * DB에서 받은 ai_recommendations 값을 파싱하여
 * 화면에 표시할 최종 답변과 출처를 추출하는 함수
 */
export function parseAiRecommendations(
  recommendations: string | null | undefined
): ParsedAiRecommendations {
  // 추천 정보가 없으면 null 반환
  if (!recommendations) {
    return { generation: null, citedChunks: null };
  }

  try {
    const parsed: AiResponse =
      typeof recommendations === "string"
        ? JSON.parse(recommendations)
        : recommendations;

    // 최종 답변과 출처(citations)를 추출하여 반환
    const generation = parsed.generation || null;
    const citedChunks = parsed.hallu_check?.cited_chunks || null;

    return { generation, citedChunks };
  } catch {
    return { generation: null, citedChunks: null };
  }
}
