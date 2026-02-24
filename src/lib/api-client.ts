// API 엔드포인트 상수
export const API_ENDPOINTS = {
  CUSTOM_FORM: "/api/custom_form",
  FORM_CHAT: "/api/form_chat",
} as const;

// 공통 API 에러 클래스
export class ApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// 통일된 API POST 호출 함수 (fetch 기반)
async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: "요청 실패" }));
    throw new ApiError(
      errorBody.error || "요청 실패",
      response.status,
      errorBody.details
    );
  }

  return response.json();
}

// 커스텀 폼 제출 응답 타입
interface CustomFormResponse {
  success: boolean;
  location_id: string;
  message: string;
}

// 채팅 응답 타입 (AiResponse에서 필요한 필드만 사용)
interface FormChatResponse {
  final_answer: string;
  hallu_check?: {
    cited_chunks?: Array<{
      source: { metadata: { pdf_filename: string; page_numbers: number[] } };
      chunk_text: string;
      metadata: { pdf_filename: string; page_numbers: number[] };
    }>;
  };
}

// 폼 제출 서비스
export async function submitCustomForm(data: {
  locationData: unknown;
  aiRequest: unknown;
}): Promise<CustomFormResponse> {
  return apiPost<CustomFormResponse>(API_ENDPOINTS.CUSTOM_FORM, data);
}

// 채팅 서비스
export async function sendChatMessage(data: {
  generated_form: string;
  query: string;
  session_id: string;
}): Promise<FormChatResponse> {
  return apiPost<FormChatResponse>(API_ENDPOINTS.FORM_CHAT, data);
}
