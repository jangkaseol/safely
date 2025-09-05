import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Safety Navigator',
    short_name: 'SafetyNav',
    description: 'A safety-focused navigation app with real-time hazard detection and route optimization',
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
        label: 'Safety Navigator main map view'
      },
      {
        src: '/screenshot-narrow.png', 
        sizes: '720x1280',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Safety Navigator mobile view'
      }
    ],
    shortcuts: [
      {
        name: 'Emergency Contacts',
        short_name: 'Emergency',
        description: 'Quick access to emergency contacts and services',
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
        name: 'Safety Report',
        short_name: 'Report',
        description: 'Report safety incidents or hazards',
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