import { createClient } from "@supabase/supabase-js"

// 이 변수들은 Vercel 환경 변수에 설정되어 있어야 합니다.
// NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 전역 변수를 사용하여 클라이언트가 싱글톤임을 보장합니다.
declare global {
  var __supabaseClient: ReturnType<typeof createClient> | undefined
}

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // 이 함수는 클라이언트 측 Supabase 클라이언트를 위해 서버에서 호출되어서는 안 됩니다.
    // 만약 호출된다면, 이는 오용 또는 빌드 시 평가 문제일 수 있습니다.
    // 빌드 시에는 환경 변수가 존재해야 합니다.
    throw new Error(
      "Supabase 클라이언트는 클라이언트 측에서만 초기화되어야 합니다. NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY가 Vercel 환경 변수에 설정되어 있는지 확인하세요.",
    )
  }

  if (!global.__supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase 환경 변수 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다.",
      )
    }
    global.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return global.__supabaseClient
}
