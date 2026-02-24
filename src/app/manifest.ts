import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '세이프리 (Safely)',
    short_name: '세이프리',
    description: 'AI 기반 안전 여행 정보 플랫폼 - 검증된 안전 정보로 걱정 없는 여행',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#2d6a4f',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ko-KR',
    categories: ['navigation', 'safety', 'travel'],
    icons: [
      {
        src: '/safely-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    prefer_related_applications: false
  }
}
