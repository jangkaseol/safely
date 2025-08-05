"use server";

import { supabaseServer } from "@/lib/supabase-server";
import type { CreateLocationPayload } from "@/lib/types";

// 새로운 장소 정보를 추가하는 서버 액션
export async function createLocation(payload: CreateLocationPayload) {
  const { locationData, files } = payload;

  // 1. locations 테이블에 기본 정보 삽입
  const { data: location, error: locationError } = await supabaseServer
    .from("locations")
    .insert(locationData as any)
    .select("id")
    .single();

  if (locationError || !location) {
    console.error("Location insert error:", locationError);
    return {
      success: false,
      error: `장소 정보 저장 실패: ${locationError.message}`,
    };
  }

  const locationId = location.id;

  // 2. 비어있는 location_details 레코드 먼저 생성
  const { error: detailsInsertError } = await supabaseServer
    .from("location_details")
    .insert({ location_id: locationId });

  if (detailsInsertError) {
    console.error("Location_details insert error:", detailsInsertError);
    await supabaseServer.from("locations").delete().eq("id", locationId);
    return { success: false, error: "장소 상세 정보 생성 실패" };
  }

  // 3. 관련 파일 정보 저장 (파일이 있는 경우)
  if (files && files.length > 0) {
    const filesToInsert = files.map((file) => ({
      ...file,
      location_id: locationId,
    }));

    const { error: fileError } = await supabaseServer
      .from("location_files")
      .insert(filesToInsert as any);

    if (fileError) {
      console.error("File insert error:", fileError);
      await supabaseServer.from("locations").delete().eq("id", locationId);
      return { success: false, error: "관련 파일 정보 저장 실패" };
    }
  }

  // 4. Supabase Edge Function 호출
  const { error: functionError } = await supabaseServer.functions.invoke(
    "process-location-analysis",
    {
      body: { location_id: locationId },
    }
  );

  if (functionError) {
    console.error("Error invoking Supabase function:", functionError);
    // 함수 호출에 실패했더라도 일단 접수는 되었으므로 성공으로 응답.
    // 백그라운드에서 재시도 로직을 구현하거나, 모니터링을 통해 수동 처리할 수 있음.
  }

  return {
    success: true,
    location_id: locationId,
    message: "성공적으로 접수되었습니다. AI 분석이 백그라운드에서 진행됩니다.",
  };
}
