export interface Location {
  id: number;
  user_id?: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  type: string | null;
  description: string | null;
  image_url: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  emergency_contacts: { name: string; contact_number: string }[] | null;
  created_at?: string;
  updated_at?: string;
  start_time: string | null;
  end_time: string | null;
  expected_attendees: string | null; // text 타입으로 변경
  location_details?: LocationDetail | null;
}

export interface LocationDetail {
  id: number;
  location_id: number;
  safety_score: number | null;
  safety_analysis_basis: string | null;
  ai_recommendations: any | null;
  real_time_alerts: string | null;
  rating: number | null;
  visitors: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LocationFiles {
  id: number;
  user_id: string | null;
  location_id: number;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  ocr_text: string | null;
  description: string | null;
  created_at: string;
}

export interface Accident {
  id: number;
  casualties: number | null;
  accident_type: string | null;
  accident_date: string | null;
  accident_overview: string | null;
  accident_photo_url: string | null;
  forensic: string | null;
  lon: number | null;
  lat: number | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: HalluCitedChunk[];
  createdAt: Date;
}

// 비상 연락처 배열의 각 항목 타입
export interface EmergencyContact {
  id: number;
  name: string;
  contact_number: string;
}

// 서버 액션 createLocation에 전달될 데이터 타입
export type CreateLocationPayload = {
  locationData: Omit<
    Location,
    "id" | "created_at" | "updated_at" | "user_id"
  > & { user_id: string };
  files: Omit<LocationFiles, "id" | "location_id" | "created_at" | "user_id">[];
  aiRecommendation: any;
};

// API 응답의 `searched_documents` 배열 내 객체 타입
export interface SearchedDocument {
  page_content: string;
  metadata: {
    source: string;
    [key: string]: unknown;
  };
}

// `hallu_check.cited_chunks` 배열 내 객체 타입
export interface HalluCitedChunk {
  source: {
    metadata: {
      pdf_filename: string;
      page_numbers: number[];
    };
  };
  chunk_text: string;
  metadata: {
    pdf_filename: string;
    page_numbers: number[];
  };
}

export interface AiResponse {
  generation: string;
  hallu_check?: {
    support_score: number;
    cited_chunks: HalluCitedChunk[];
    claims: {
      claim: string;
      support_score: number;
      support_source_indices: number[];
    }[];
    answer_with_citations: string;
  };
  query_list: string[];
  final_answer: string;
  place_name: string;
  type: string;
  period: string;
  description: string;
  category: string;
  related_documents: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  searched_documents: SearchedDocument[];
}
