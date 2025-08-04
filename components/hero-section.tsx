"use client"

export default function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/placeholder.svg?height=600&width=1200')`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">안전하고 즐거운 여행을 함께</h1>
        <p className="text-lg md:text-xl mb-8 opacity-90">검증된 안전 정보로 걱정 없는 여행을 계획하세요</p>
      </div>
    </section>
  )
}
