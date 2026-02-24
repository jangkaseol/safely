"use client";

import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Share } from 'lucide-react';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
  className?: string;
}

export function PWAInstallPrompt({ onDismiss, className }: PWAInstallPromptProps) {
  const { 
    canInstall, 
    isInstalled, 
    isIOS, 
    installApp, 
    getIOSInstructions,
    isPWACapable 
  } = usePWA();
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if already installed, dismissed, or not PWA capable
  if (isInstalled || isDismissed || !isPWACapable || !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, just show instructions
      return;
    }

    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        handleDismiss();
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const iosInstructions = getIOSInstructions();

  return (
    <Card className={`border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="relative pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-blue-100"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-blue-900">
              세이프리 설치
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 mt-1">
              Progressive Web App
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-gray-600">
          오프라인 접속, 푸시 알림, 빠른 로딩으로 더 나은 앱 경험을 만나보세요.
        </CardDescription>

        {isIOS ? (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Share className="h-4 w-4" />
                {iosInstructions.title}
              </p>
              <ol className="space-y-1 text-sm text-blue-800">
                {iosInstructions.steps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-xs text-gray-500 text-center">
              iOS Safari에서의 설치 방법
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                오프라인 접속
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                푸시 알림
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                빠른 로딩
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                홈 화면 아이콘
              </div>
            </div>
            
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isInstalling ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  설치 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  앱 설치
                </div>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          무료 • 앱스토어 불필요 • 즉시 업데이트
        </div>
      </CardContent>
    </Card>
  );
}