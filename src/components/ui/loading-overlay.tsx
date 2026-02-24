"use client";

import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export default function LoadingOverlay({
  isLoading,
  text = "AI 분석이 진행되는 동안 잠시만 기다려주세요...",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm",
        "transition-opacity duration-300 ease-in-out",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
      <div className="flex space-x-2">
        <div className="h-3 w-3 animate-pulsing-dot rounded-full bg-blue-400 [animation-delay:-0.3s]"></div>
        <div className="h-3 w-3 animate-pulsing-dot rounded-full bg-blue-400 [animation-delay:-0.15s]"></div>
        <div className="h-3 w-3 animate-pulsing-dot rounded-full bg-blue-400"></div>
      </div>
      <p className="mt-6 text-center text-lg font-semibold text-white">
        {text}
      </p>
      <p className="mt-2 text-sm text-gray-300">
        접속자 수에 따라 최대 1분까지 소요될 수 있습니다.
      </p>
    </div>
  );
}
