"use client";

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
    installPrompt: null
  });

  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState(false);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);

  // Check PWA installation state
  useEffect(() => {
    const checkPWAState = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      setState(prev => ({
        ...prev,
        isIOS,
        isStandalone,
        isInstalled: isStandalone
      }));
    };

    checkPWAState();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAState);

    return () => {
      mediaQuery.removeEventListener('change', checkPWAState);
    };
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e
      }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        setIsServiceWorkerSupported(true);

        const pwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';
        if (!pwaEnabled) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          setIsServiceWorkerRegistered(false);
          return;
        }

        if (process.env.NODE_ENV !== 'production') {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          setIsServiceWorkerRegistered(false);
          return;
        }
        
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          setIsServiceWorkerRegistered(true);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                }
              });
            }
          });

        } catch (error) {
          console.error('[PWA] Service worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (!state.installPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const choiceResult = await state.installPrompt.userChoice;
      
      setState(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: false
      }));

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Error during installation:', error);
      return false;
    }
  }, [state.installPrompt]);

  // Get installation instructions for iOS
  const getIOSInstructions = useCallback(() => {
    return {
      title: '세이프리 설치',
      steps: [
        '화면 하단의 공유 버튼을 탭하세요',
        '아래로 스크롤하여 "홈 화면에 추가"를 탭하세요',
        '오른쪽 상단의 "추가"를 탭하세요'
      ]
    };
  }, []);

  // Check if app can be installed
  const canInstall = state.isInstallable || (state.isIOS && !state.isStandalone);

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      } catch (error) {
        console.error('[PWA] Service worker update failed:', error);
      }
    }
  }, []);

  return {
    // State
    isInstallable: state.isInstallable,
    isInstalled: state.isInstalled,
    isIOS: state.isIOS,
    isStandalone: state.isStandalone,
    canInstall,
    isServiceWorkerSupported,
    isServiceWorkerRegistered,
    
    // Actions
    installApp,
    getIOSInstructions,
    updateServiceWorker,
    
    // Utils
    isPWACapable: isServiceWorkerSupported && (state.isInstallable || state.isIOS)
  };
}
