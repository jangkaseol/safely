import type React from "react";
import type { Metadata, Viewport } from "next"; // Viewport 임포트
import { Inter, Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "세이프리 - 안전하고 즐거운 여행을 함께",
  description: "세이프리와 함께 검증된 안전 정보로 걱정 없는 여행을 계획하세요",
  generator: "v0.dev",
  icons: {
    icon: "/safely-logo.png",
  },
};

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

// 새로운 viewport export를 추가합니다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKR.variable} font-sans`}>
        {/*
          카카오 맵 스크립트 로딩 주의사항:
          1. libraries=services 필수: Geocoder 등 서비스 라이브러리 사용 위해 반드시 포함
          2. autoload=false 유지: react-kakao-maps-sdk가 직접 초기화 관리하도록 함
          3. strategy="beforeInteractive": 페이지 로드 전에 스크립트 로딩 완료

          ❌ 주의: autoload=true로 변경하면 react-kakao-maps-sdk와 충돌 발생
          ❌ 주의: libraries=services 누락하면 Geocoder 사용 불가
        */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
