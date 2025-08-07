"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CreateLocationPayload } from "@/lib/types";

// 새로운 장소 정보를 추가하는 서버 액션
export async function createLocation(payload: CreateLocationPayload) {
  const { locationData, files, aiRecommendation } = payload;

  // 1. locations 테이블에 기본 정보 삽입
  const { data: location, error: locationError } = await supabaseAdmin
    .from("locations")
    .insert(locationData as any)
    .select("id")
    .single();

  if (locationError || !location) {
    console.error("Location insert error:", locationError);
    return {
      success: false,
      error: `장소 정보 저장 실패: ${locationError?.message}`,
    };
  }

  const locationId = location.id;

  // 2. AI 분석 결과를 포함하여 location_details 레코드 생성
  const { error: detailsInsertError } = await supabaseAdmin
    .from("location_details")
    .insert({
      location_id: locationId,
      ai_recommendations: aiRecommendation, // 전달받은 AI 분석 결과 저장
    });

  if (detailsInsertError) {
    console.error("Location_details insert error:", detailsInsertError);
    // 롤백: 방금 생성한 location 레코드 삭제
    await supabaseAdmin.from("locations").delete().eq("id", locationId);
    return { success: false, error: "장소 상세 정보 생성 실패" };
  }

  // 3. 관련 파일 정보 저장 (파일이 있는 경우) - 이 로직은 현재 사용되지 않지만, 만약을 위해 유지합니다.
  if (files && files.length > 0) {
    const filesToInsert = files.map((file) => ({
      ...file,
      location_id: locationId,
    }));

    const { error: fileError } = await supabaseAdmin
      .from("location_files")
      .insert(filesToInsert as any);

    if (fileError) {
      console.error("File insert error:", fileError);
      // 롤백
      await supabaseAdmin.from("locations").delete().eq("id", locationId);
      await supabaseAdmin
        .from("location_details")
        .delete()
        .eq("location_id", locationId);
      return { success: false, error: "관련 파일 정보 저장 실패" };
    }
  }

  // 4. Supabase Edge Function 호출은 더 이상 필요하지 않으므로 주석 처리 또는 삭제
  /*
  const { error: functionError } = await supabaseServer.functions.invoke(
    "process-location-analysis",
    {
      body: { location_id: locationId },
    }
  );

  if (functionError) {
    console.error("Error invoking Supabase function:", functionError);
  }
  */

  return {
    success: true,
    location_id: locationId,
    message: "성공적으로 접수 및 AI 분석이 완료되었습니다.",
  };
}
