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
  expected_attendees: string | null; // text 타입으로 변경
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
    category: location.type,
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

// Simple in-memory cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Cache key generator for consistent caching
function generateCacheKey(operation: string, params: any): string {
  return `${operation}:${JSON.stringify(params)}`;
}

// Generic cache getter with TTL check
function getFromCache<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

// Generic cache setter
function setCache<T>(key: string, data: T): void {
  queryCache.set(key, { data, timestamp: Date.now() });
}

export async function getPlaces(categories?: string[], searchQuery?: string) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey('getPlaces', { categories, searchQuery });
    
    // Check cache first
    const cachedResult = getFromCache<{ success: boolean; data: Place[] }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let query = supabaseServer
      .from("locations")
      .select("*, location_details(*)")
      .order("created_at", { ascending: false });

    if (categories && categories.length > 0) {
      query = query.in("type", categories);
    }

    if (searchQuery) {
      // Optimized search query with better indexing potential
      query = query.or(
        `name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching places:", error);
      return { success: false, error: error.message, data: [] };
    }

    // Transform data
    const transformedData: Place[] = data.map((row: any) =>
      transformPlaceData(
        row as LocationRow,
        row.location_details as LocationDetailsRow | null
      )
    );

    const result = { success: true, data: transformedData };
    
    // Cache successful results
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

export async function getPlaceById(id: string) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey('getPlaceById', { id });
    
    // Check cache first
    const cachedResult = getFromCache<{ success: boolean; data: Place | null }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

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

    const result = { success: true, data: transformedData };
    
    // Cache successful results
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      data: null,
    };
  }
}

export async function getAccidents(lat: string, lng: string, radius: string) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey('getAccidents', { lat, lng, radius });
    
    // Check cache first
    const cachedResult = getFromCache<{ success: boolean; data: Accident[] }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Convert coordinates to numbers for better query performance
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return { success: false, error: "Invalid coordinates or radius", data: [] };
    }

    // Optimized query with numeric comparisons instead of string operations
    const { data, error } = await supabaseServer
      .from("accidents")
      .select("*")
      .gte("lat", latitude - radiusKm / 111) // Approximate degree conversion
      .lte("lat", latitude + radiusKm / 111)
      .gte("lon", longitude - radiusKm / (111 * Math.cos(latitude * Math.PI / 180)))
      .lte("lon", longitude + radiusKm / (111 * Math.cos(latitude * Math.PI / 180)))
      .order("occurred_at", { ascending: false });

    if (error) {
      console.error("Error fetching accidents:", error);
      return { success: false, error: error.message, data: [] };
    }

    const result = { success: true, data: data || [] };
    
    // Cache successful results
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

export async function searchPlaceNames(query: string, limit: number = 10) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey('searchPlaceNames', { query, limit });
    
    // Check cache first
    const cachedResult = getFromCache<{ success: boolean; data: any[] }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const { data, error } = await supabaseServer
      .from("locations")
      .select("id, name, location")
      .ilike("name", `%${query}%`)
      .limit(limit)
      .order("name");

    if (error) {
      console.error("Error searching place names:", error);
      return { success: false, error: error.message, data: [] };
    }

    const result = { success: true, data: data || [] };
    
    // Cache successful results with shorter TTL for search queries
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred", data: [] };
  }
}

// Cache cleanup function (can be called periodically)
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  }
}

// createPlace 함수는 현재 UI에서 직접 사용되지 않으며,
// locations와 location_details 두 테이블에 걸쳐 데이터를 생성해야 하므로
// 복잡성이 증가합니다. 필요시 별도로 구현해야 합니다.
// 현재는 제거합니다.
// export async function createPlace(...) { ... }