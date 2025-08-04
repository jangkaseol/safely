"use server"

import { supabaseServer } from "@/lib/supabase-server"

// Category 인터페이스는 locations 테이블의 category 컬럼에서 파생됩니다.
export interface Category {
  id: string // 카테고리 이름을 ID로 사용
  name: string
  icon: string | null // DB 스키마에 직접적인 아이콘 컬럼이 없으므로 null
  color: string | null // DB 스키마에 직접적인 색상 컬럼이 없으므로 null
}

export async function getCategories() {
  try {
    // 'locations' 테이블에서 고유한 'category' 값을 가져옵니다.
    const { data, error } = await supabaseServer
      .from("locations")
      .select("category")
      .not("category", "is", null) // null 값은 제외
      .order("category", { ascending: true }) // 카테고리 이름으로 정렬

    if (error) {
      console.error("Error fetching distinct categories:", error)
      return { success: false, error: error.message, data: [] }
    }

    // 중복을 제거하고 Category 인터페이스에 맞게 변환합니다.
    const uniqueCategories = Array.from(new Set(data.map((row) => row.category))).map((categoryName) => ({
      id: categoryName as string, // 카테고리 이름을 ID로 사용
      name: categoryName as string,
      icon: null, // DB에 없으므로 null
      color: null, // DB에 없으므로 null
    }))

    return { success: true, data: uniqueCategories }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred", data: [] }
  }
}
