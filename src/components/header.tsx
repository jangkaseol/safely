"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    toast("로그인 기능은 준비 중입니다");
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 h-14">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/safely-logo.png" alt="세이프리" className="w-7 h-7" />
          <span className="text-base font-semibold text-gray-900">세이프리</span>
        </Link>

        {/* Center: Nav (desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/map" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            지도
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            소개
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoginClick}
            className="hidden md:inline-flex text-sm text-gray-600 hover:text-gray-900"
          >
            로그인
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 space-y-1">
          <Link
            href="/map"
            className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            지도
          </Link>
          <Link
            href="/"
            className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            소개
          </Link>
          <button
            onClick={() => { handleLoginClick(); setIsMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
          >
            로그인
          </button>
        </div>
      )}
    </header>
  );
}
