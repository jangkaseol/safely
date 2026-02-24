/** 맵 관련 공용 상수 */

/** 장소 카테고리 ID 목록 (관광지, 축제) */
export const PLACE_CATEGORY_IDS = ["tourist_spot", "festival"] as const;

/** 사고 위치 카테고리 ID */
export const ACCIDENT_CATEGORY_ID = "accident_location" as const;

/** 검색/필터용 정적 카테고리 목록 */
export const STATIC_CATEGORIES = [
  { id: "all", name: "전체" },
  { id: "tourist_spot", name: "관광지" },
  { id: "festival", name: "축제" },
  { id: "accident_location", name: "사고 위치" },
] as const;

/** 지도 기본 중심 좌표 (대한민국 중심부) */
export const DEFAULT_MAP_CENTER = { lat: 36.5, lng: 127.5 } as const;

/** 사고 데이터 조회 기본 반경 (미터) */
export const DEFAULT_ACCIDENT_RADIUS = "5000" as const;
