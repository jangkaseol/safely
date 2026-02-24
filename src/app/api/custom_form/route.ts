import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { createLocation } from "@/app/actions/register";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationData, aiRequest } = body;
    console.log("Received aiRequest:", JSON.stringify(aiRequest, null, 2));

    const aiRequestForServer = { ...aiRequest };
    if (
      aiRequestForServer.related_documents &&
      Array.isArray(aiRequestForServer.related_documents) &&
      aiRequestForServer.related_documents.length > 0
    ) {
      // "string 형태로" 보내기 위해 첫 번째 파일의 내용만 추출
      aiRequestForServer.related_documents =
        aiRequestForServer.related_documents[0].file_content;
    } else if ("related_documents" in aiRequestForServer) {
      // related_documents가 있지만 비어있는 경우 필드 자체를 제거
      delete aiRequestForServer.related_documents;
    }

    // custom_form 전용 외부 API URL
    const custom_form_url = "http://203.237.81.58:25723/api/custom_form";

    const response = await fetch(custom_form_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(aiRequestForServer), // 프론트에서 받은 aiRequest를 그대로 전달
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Custom Form AI Server Error:",
        errorText,
        "Status:",
        response.status
      );
      return new NextResponse(
        JSON.stringify({
          error: "Custom Form AI 서버에서 오류가 발생했습니다.",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const aiRecommendation = await response.json(); // AI 분석 결과 (jsonb)

    // const {
    //   data: { user },
    // } = await supabaseServer.auth.getUser();

    // if (!user) {
    //   return new NextResponse(JSON.stringify({ error: "User not found" }), {
    //     status: 401,
    //   });
    // }

    // DB 저장을 위한 최종 페이로드 구성
    const payload = {
      locationData: {
        ...locationData,
        // user_id: user.id, // MVP 단계에서는 user_id 제거
      },
      files: [],
      aiRecommendation: aiRecommendation,
    };

    const { success, location_id, error } = await createLocation(payload);

    if (error) {
      throw new Error(error);
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        location_id,
        message: "장소 등록 및 AI 분석 완료",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in custom_form proxy:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({
        error: "An internal server error occurred",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
