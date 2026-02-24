import { NextRequest, NextResponse } from "next/server";
import { createLocation } from "@/app/actions/register";

// TODO: 인증 로직 추가 필요

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationData, aiRequest } = body;

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

    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL이 설정되지 않았습니다.", details: "API_URL 환경 변수를 확인하세요." },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/api/custom_form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(aiRequestForServer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Custom Form AI Server Error:", errorText, "Status:", response.status);
      return NextResponse.json(
        { error: "Custom Form AI 서버에서 오류가 발생했습니다.", details: errorText },
        { status: response.status }
      );
    }

    const aiRecommendation = await response.json();

    // DB 저장을 위한 최종 페이로드 구성
    const payload = {
      locationData: { ...locationData },
      files: [],
      aiRecommendation,
    };

    const { location_id, error } = await createLocation(payload);

    if (error) {
      throw new Error(error);
    }

    return NextResponse.json({
      success: true,
      location_id,
      message: "장소 등록 및 AI 분석 완료",
    });
  } catch (error) {
    console.error("Error in custom_form proxy:", error);
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { error: "내부 서버 오류가 발생했습니다.", details: errorMessage },
      { status: 500 }
    );
  }
}
