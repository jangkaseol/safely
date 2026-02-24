import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      console.error("API_URL 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "API URL이 설정되지 않았습니다.", details: "API_URL 환경 변수를 확인하세요." },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/api/form_chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Server Error:", errorText, "Status:", response.status);
      return NextResponse.json(
        { error: "AI 서버에서 오류가 발생했습니다.", details: errorText },
        { status: response.status }
      );
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      console.error("Failed to parse AI server response:", text);
      return NextResponse.json(
        { error: "AI 서버 응답 파싱에 실패했습니다.", details: text },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in form_chat proxy:", error);
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { error: "내부 서버 오류가 발생했습니다.", details: errorMessage },
      { status: 500 }
    );
  }
}
