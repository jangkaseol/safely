"use client";

import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button"; // Button 컴포넌트 임포트
// import Link from "next/link" // Link 컴포넌트 임포트 제거

export default function Header() {
  const handleLoginClick = () => {
    alert("로그인/회원가입 기능은 아직 구현되지 않았습니다.");
    // 여기에 로그인 페이지로 이동하거나 로그인 모달을 여는 로직을 추가할 수 있습니다.
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 py-3">
        {/* h-full 및 justify-between 제거 */}
        <div className="flex items-center justify-center">
          {/* flex-1 및 정렬 변경 제거 */}
          <div className="flex items-center gap-2">
            <img
              src="/safety-navigator.png"
              alt="안전 네비게이터 로고"
              className="w-8 h-8"
            />
            <span className="text-lg font-bold text-gray-900">
              안전 네비게이터
            </span>
          </div>
          {/* Link 컴포넌트 제거 및 onClick 핸들러 복원 */}
          <Button
            variant="ghost"
            onClick={handleLoginClick}
            className="ml-auto"
          >
            로그인
          </Button>
        </div>
      </div>
    </header>
  );
}
