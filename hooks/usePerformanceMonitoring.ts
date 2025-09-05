"use client";

import { useEffect, useRef, useCallback } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  mapLoadTime?: number;
  searchResponseTime?: number;
  markerRenderTime?: number;
  cacheHitRate?: number;
  memoryUsage?: number;
}

// Custom performance monitoring hook
export function usePerformanceMonitoring() {
  const metricsRef = useRef<PerformanceMetrics>({});
  const timersRef = useRef<Map<string, number>>(new Map());

  // Start timing a performance measure
  const startMeasure = useCallback((name: string) => {
    const startTime = performance.now();
    timersRef.current.set(name, startTime);
    
    // Also use Performance API marks
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }, []);

  // End timing and record measure
  const endMeasure = useCallback((name: string) => {
    const startTime = timersRef.current.get(name);
    if (!startTime) return 0;

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Update metrics
    metricsRef.current = {
      ...metricsRef.current,
      [name]: duration
    };

    // Use Performance API measures
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }

    timersRef.current.delete(name);
    return duration;
  }, []);

  // Record cache hit/miss
  const recordCacheHit = useCallback((hit: boolean) => {
    const current = metricsRef.current.cacheHitRate || 0;
    // Simple moving average for cache hit rate
    const newRate = hit ? current + 0.1 : current - 0.1;
    metricsRef.current.cacheHitRate = Math.max(0, Math.min(1, newRate));
  }, []);

  // Record memory usage (if available)
  const recordMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window as any).performance) {
      const memory = (window as any).performance.memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
    }
  }, []);

  // Get current metrics
  const getMetrics = useCallback(() => {
    recordMemoryUsage();
    return { ...metricsRef.current };
  }, [recordMemoryUsage]);

  // Log performance report to console (dev mode)
  const logPerformanceReport = useCallback(() => {
    const metrics = getMetrics();
    
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Performance Metrics');
      if (metrics.mapLoadTime) {
        console.log(`📍 Map Load Time: ${metrics.mapLoadTime.toFixed(2)}ms`);
      }
      if (metrics.searchResponseTime) {
        console.log(`🔍 Search Response Time: ${metrics.searchResponseTime.toFixed(2)}ms`);
      }
      if (metrics.markerRenderTime) {
        console.log(`📌 Marker Render Time: ${metrics.markerRenderTime.toFixed(2)}ms`);
      }
      if (metrics.cacheHitRate !== undefined) {
        console.log(`🎯 Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      }
      if (metrics.memoryUsage) {
        console.log(`🧠 Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
      }
      console.groupEnd();
    }
  }, [getMetrics]);

  return {
    startMeasure,
    endMeasure,
    recordCacheHit,
    recordMemoryUsage,
    getMetrics,
    logPerformanceReport
  };
}

// Web Vitals hook for Core Web Vitals monitoring
export function useWebVitals() {
  const vitalsRef = useRef<{
    LCP?: number;
    FID?: number;
    CLS?: number;
  }>({});

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
      onLCP((metric: any) => {
        vitalsRef.current.LCP = metric.value;
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 LCP (Largest Contentful Paint):', metric.value, 'ms');
        }
      });

      onINP((metric: any) => {
        vitalsRef.current.FID = metric.value;
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ INP (Interaction to Next Paint):', metric.value, 'ms');
        }
      });

      onCLS((metric: any) => {
        vitalsRef.current.CLS = metric.value;
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 CLS (Cumulative Layout Shift):', metric.value);
        }
      });
    }).catch(error => {
      console.warn('Web Vitals could not be loaded:', error);
    });
  }, []);

  const getWebVitals = useCallback(() => {
    return { ...vitalsRef.current };
  }, []);

  return { getWebVitals };
}