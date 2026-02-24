"use client";

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}

// Generate blur placeholder for better UX
function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a gradient blur effect
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(0.5, '#e5e7eb');
    gradient.addColorStop(1, '#d1d5db');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

// Check if image is already in WebP/AVIF format
function isModernImageFormat(src: string): boolean {
  return src.toLowerCase().includes('.webp') || 
         src.toLowerCase().includes('.avif');
}

// Generate responsive sizes based on common breakpoints
function generateSizes(customSizes?: string): string {
  if (customSizes) return customSizes;
  
  return [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 50vw', 
    '(max-width: 1024px) 33vw',
    '25vw'
  ].join(', ');
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  sizes,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const computedBlurData = useMemo(() => {
    if (placeholder !== 'blur' || blurDataURL || typeof window === 'undefined') {
      return '';
    }

    return generateBlurDataURL(width || 20, height || 20);
  }, [placeholder, blurDataURL, width, height]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // If image failed to load, show fallback
  if (imageError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400 text-sm",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gray-200 flex items-center justify-center">
            📷
          </div>
          Image unavailable
        </div>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    className: cn(
      "transition-opacity duration-300",
      imageLoaded ? "opacity-100" : "opacity-0",
      className
    ),
    onLoad: handleLoad,
    onError: handleError,
    priority,
    loading: priority ? 'eager' : loading,
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes || !fill ? { sizes: generateSizes(sizes) } : {}),
    ...(placeholder === 'blur' ? {
      placeholder: 'blur' as const,
      blurDataURL: blurDataURL || computedBlurData || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
    } : {}),
    quality: isModernImageFormat(src) ? 100 : 85,
  };

  return (
    <div className="relative">
      <Image {...imageProps} />
      
      {/* Loading overlay for better UX */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset optimized image components for common use cases
export function OptimizedAvatar({ 
  src, 
  alt, 
  size = 40,
  className 
}: { 
  src: string; 
  alt: string; 
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      sizes={`${size}px`}
      priority={size >= 100} // Prioritize larger avatars
    />
  );
}

export function OptimizedHero({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes="100vw"
      priority // Hero images should be prioritized
    />
  );
}

export function OptimizedThumbnail({ 
  src, 
  alt, 
  width = 200,
  height = 150,
  className 
}: { 
  src: string; 
  alt: string; 
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-cover rounded-lg", className)}
      sizes="(max-width: 768px) 50vw, 25vw"
    />
  );
}
