import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '세이프리 (Safely)',
    short_name: '세이프리',
    description: 'AI 기반 안전 여행 정보 플랫폼 - 검증된 안전 정보로 걱정 없는 여행',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ko-KR',
    categories: ['navigation', 'safety', 'travel', 'utilities'],
    icons: [
      {
        src: '/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: '세이프리 메인 지도 화면'
      },
      {
        src: '/screenshot-narrow.png', 
        sizes: '720x1280',
        type: 'image/png',
        form_factor: 'narrow',
        label: '세이프리 모바일 화면'
      }
    ],
    shortcuts: [
      {
        name: '비상 연락처',
        short_name: '비상연락',
        description: '긴급 연락처 및 서비스 바로가기',
        url: '/emergency',
        icons: [
          {
            src: '/emergency-icon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      {
        name: '안전 신고',
        short_name: '신고',
        description: '안전 사고 또는 위험 요소 신고',
        url: '/report',
        icons: [
          {
            src: '/report-icon.png',
            sizes: '192x192', 
            type: 'image/png'
          }
        ]
      }
    ],
    prefer_related_applications: false
  }
}