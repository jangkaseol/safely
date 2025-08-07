"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { Accident } from "@/lib/types";

// Supabase에서 직접 가져오는 locations 테이블의 row 타입
interface LocationRow {
  id: string; // bigint from DB, handled as string in JS
  user_id: string | null;
  name: string;
  location: string; // This is the address field in the DB
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  type: string | null;
  description: string | null;
  image_url: string | null;
  category: string | null;
  start_date: string | null; // date type from DB (e.g., "YYYY-MM-DD")
  end_date: string | null; // date type from DB
  status: string | null;
  emergency_contacts: any; // jsonb type
  created_at: string;
  updated_at: string;
  start_time: string | null; // time without time zone
  end_time: string | null; // time without time zone
}

// Supabase에서 직접 가져오는 location_details 테이블의 row 타입
interface LocationDetailsRow {
  id: string; // bigint from DB
  location_id: string; // bigint from DB, handled as string in JS
  safety_score: number | null; // integer from DB
  safety_analysis_basis: string | null; // text from DB
  ai_recommendations: string | null; // text from DB
  real_time_alerts: string | null; // text from DB
  rating: number | null; // numeric from DB
  visitors: string | null; // text from DB (e.g., "1000명")
  created_at: string;
  updated_at: string;
}

// 프론트엔드에서 사용할 Place 인터페이스 (locations와 location_details 정보 결합)
export interface Place {
  id: string;
  name: string;
  address: string; // locations.location
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  image_url: string | null;
  category: string | null;
  period_start: string | null; // locations.start_date
  period_end: string | null; // locations.end_date
  created_at: string;
  updated_at: string;

  // location_details에서 가져오는 정보
  safety_score: number | null;
  safety_analysis_basis: string | null;
  ai_recommendations: string | null;
  real_time_alerts: string | null;
  rating: number | null;
  visitors: string | null; // location_details.visitors (text 타입)

  // AI 분석 제목 및 내용 (safety_analysis_basis 또는 ai_recommendations 기반으로 파생)
  ai_analysis_title?: string | null;
  ai_analysis_content?: string | null;
}

// Supabase에서 가져온 raw 데이터를 Place 인터페이스에 맞게 변환하는 헬퍼 함수
function transformPlaceData(
  location: LocationRow,
  details: LocationDetailsRow | null
): Place {
  return {
    id: location.id,
    name: location.name,
    address: location.location,
    latitude: location.latitude,
    longitude: location.longitude,
    description: location.description,
    image_url: location.image_url,
    category: location.category,
    period_start: location.start_date,
    period_end: location.end_date,
    created_at: location.created_at,
    updated_at: location.updated_at,
    safety_score: details?.safety_score || null,
    safety_analysis_basis: details?.safety_analysis_basis || null,
    ai_recommendations: details?.ai_recommendations || null,
    real_time_alerts: details?.real_time_alerts || null,
    rating: details?.rating || null,
    visitors: details?.visitors || null,
    // AI 분석 제목은 safety_analysis_basis가 있으면 "AI 안전 분석"으로 설정
    ai_analysis_title: details?.safety_analysis_basis ? "AI 안전 분석" : null,
    // AI 분석 내용은 safety_analysis_basis 또는 ai_recommendations 중 하나를 사용
    ai_analysis_content:
      details?.safety_analysis_basis || details?.ai_recommendations || null,
  };
}

export async function getPlaces(category?: string, searchQuery?: string) {
  try {
    let query = supabaseServer
      .from("locations")
      .select("*, location_details(*)") // locations 테이블과 location_details 테이블을 조인하여 모든 컬럼 선택
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (searchQuery) {
      // locations 테이블의 name, location(주소), description 컬럼에서 검색
      query = query.or(
        `name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching places:", error);
      return { success: false, error: error.message, data: [] };
    }

    // 가져온 데이터를 Place 인터페이스에 맞게 변환
    const transformedData: Place[] = data.map((row: any) =>
      transformPlaceData(
        row as LocationRow,
        row.location_details as LocationDetailsRow | null
      )
    );

    return { success: true, data: transformedData };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

export async function getPlaceById(id: string) {
  try {
    const { data, error } = await supabaseServer
      .from("locations")
      .select("*, location_details(*)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching place:", error);
      return { success: false, error: error.message, data: null };
    }

    const transformedData = transformPlaceData(
      data as LocationRow,
      data.location_details as LocationDetailsRow | null
    );

    return { success: true, data: transformedData };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      data: null,
    };
  }
}

export async function searchPlaceNames(query: string, limit = 10) {
  try {
    if (!query.trim()) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabaseServer
      .from("locations")
      .select("id, name, location") // location 필드(주소) 추가
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error searching place names:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

export async function getAccidents(
  lat?: string | null,
  lon?: string | null,
  radius?: string | null
): Promise<{ success: boolean; data: Accident[]; error?: string }> {
  try {
    let query;
    if (lat && lon && radius) {
      query = supabaseServer.rpc("find_accidents_in_radius", {
        lat_center: parseFloat(lat),
        lon_center: parseFloat(lon),
        radius_meters: parseInt(radius, 10),
      });
    } else {
      query = supabaseServer.from("press_release_unique").select(
        `
        id,
        사상자수,
        재난사고유형,
        사고일자,
        사고개요,
        사고현장사진URL주소,
        "Forensic",
        lon,
        lat
      `
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return { success: false, data: [], error: error.message };
    }

    interface AccidentItem {
      id: number;
      사상자수: number;
      재난사고유형: string;
      사고일자: string;
      사고개요: string;
      사고현장사진URL주소: string;
      Forensic: string;
      lon: number;
      lat: number;
    }

    const formattedData: Accident[] = data.map((item: AccidentItem) => ({
      id: item.id,
      casualties: item.사상자수,
      accident_type: item.재난사고유형,
      accident_date: item.사고일자,
      accident_overview: item.사고개요,
      accident_photo_url: item.사고현장사진URL주소,
      forensic: item.Forensic,
      lon: item.lon,
      lat: item.lat,
    }));

    return { success: true, data: formattedData };
  } catch (error: unknown) {
    console.error("API route error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, data: [], error: errorMessage };
  }
}
// createPlace 함수는 현재 UI에서 직접 사용되지 않으며,
// locations와 location_details 두 테이블에 걸쳐 데이터를 생성해야 하므로
// 복잡성이 증가합니다. 필요시 별도로 구현해야 합니다.
// 현재는 제거합니다.
// export async function createPlace(...) { ... }
