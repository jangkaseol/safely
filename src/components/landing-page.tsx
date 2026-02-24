"use client";

import Link from "next/link";
import { Shield, Map, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const features = [
  {
    icon: Shield,
    title: "AI 안전 분석",
    description: "실시간 AI가 분석한 여행지별 안전 정보를 확인하세요",
  },
  {
    icon: Map,
    title: "안전 지도",
    description: "관광지, 축제, 사고 위치를 한눈에 파악하세요",
  },
  {
    icon: MessageSquare,
    title: "AI 상담",
    description: "여행지에 대해 궁금한 점을 AI에게 물어보세요",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm mb-6">
                <Shield className="w-4 h-4" />
                <span>AI 기반 안전 여행 플랫폼</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                안전한 여행의
                <br />
                <span className="text-gray-400">시작,</span>{" "}
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  세이프리
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                검증된 안전 정보와 AI 분석으로
                <br className="hidden sm:block" />
                걱정 없는 여행을 계획하세요
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/map">
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 h-12 text-base rounded-xl w-full sm:w-auto"
                  >
                    지도 보기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="flex-1 relative hidden md:block">
              <div className="relative w-full max-w-md mx-auto">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">세이프리</p>
                    <p className="text-sm text-gray-500 mt-1">Safely</p>
                  </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gray-50 rounded-full -z-10" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gray-50 rounded-full -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              더 안전한 여행을 위한 기능
            </h2>
            <p className="text-gray-500">
              AI와 데이터 기반으로 여행의 안전을 지킵니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 md:p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center mb-5 transition-colors">
                  <feature.icon className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-500 mb-8">
            세이프리와 함께 안전한 여행을 계획해보세요
          </p>
          <Link href="/map">
            <Button
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 h-12 text-base rounded-xl"
            >
              지도 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* PWA Install Prompt */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <PWAInstallPrompt className="mx-auto max-w-lg" />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">
            세이프리 (Safely) · 안전하고 즐거운 여행을 함께
          </p>
        </div>
      </footer>
    </div>
  );
}
