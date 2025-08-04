import type React from "react"
import type { Metadata, Viewport } from "next" // Viewport 임포트
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "안전 네비게이터 - 안전하고 즐거운 여행을 함께",
  description: "검증된 안전 정보로 걱정 없는 여행을 계획하세요",
    generator: 'v0.dev'
}

// 새로운 viewport export를 추가합니다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
