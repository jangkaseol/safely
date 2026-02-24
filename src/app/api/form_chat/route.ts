import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

    if (!NEXT_PUBLIC_API_URL) {
      const errorMessage =
        "NEXT_PUBLIC_API_URL이 서버 환경 변수에 설정되지 않았습니다.";
      console.error(errorMessage);
      return new NextResponse(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/form_chat`, {
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
      return new NextResponse(
        JSON.stringify({
          error: "AI 서버에서 오류가 발생했습니다.",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return new NextResponse(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Failed to parse AI server response: ", text);
      return new NextResponse(
        JSON.stringify({ error: "Failed to parse AI server response" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in form_chat proxy:", error);
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
