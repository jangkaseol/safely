"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type React from "react";

interface UseBottomSheetDragOptions {
  minHeight?: number;
  midHeightRatio?: number;
  topOffset?: number;
}

interface UseBottomSheetDragReturn {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  height: number;
  isDragging: boolean;
  isContentVisible: boolean;
  handleDragStart: (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => void;
}

export function useBottomSheetDrag(
  options: UseBottomSheetDragOptions = {}
): UseBottomSheetDragReturn {
  const {
    minHeight = 80,
    midHeightRatio = 0.4,
    topOffset = 164,
  } = options;

  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const initialSheetHeight = useRef(0);

  // Throttling for drag operations
  const dragAnimationFrameRef = useRef<number>(undefined);
  const lastDragTime = useRef(0);

  const midHeight =
    typeof window !== "undefined" ? window.innerHeight * midHeightRatio : 300;
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight - topOffset : 600;

  const [height, setHeight] = useState(minHeight);

  const handleDragStart = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      if (!sheetRef.current) return;
      setIsDragging(true);
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      initialSheetHeight.current = sheetRef.current.clientHeight;
      sheetRef.current.style.transition = "none";
    },
    []
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      // Throttle drag updates using requestAnimationFrame
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
      }

      dragAnimationFrameRef.current = requestAnimationFrame(() => {
        const currentTime = performance.now();
        // Limit updates to ~60fps (16.67ms intervals)
        if (currentTime - lastDragTime.current < 16) return;

        const currentY = "touches" in e ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY.current;
        let newHeight = initialSheetHeight.current - deltaY;
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        setHeight(newHeight);

        lastDragTime.current = currentTime;
      });
    },
    [isDragging, minHeight, maxHeight]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;

    // Cancel any pending animation frame
    if (dragAnimationFrameRef.current) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
    }

    setIsDragging(false);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.3s ease-out";
      const currentHeight = sheetRef.current.clientHeight;
      let snapHeight = minHeight;
      if (currentHeight < (minHeight + midHeight) / 2) {
        snapHeight = minHeight;
      } else if (currentHeight < (midHeight + maxHeight) / 2) {
        snapHeight = midHeight;
      } else {
        snapHeight = maxHeight;
      }
      setHeight(snapHeight);
    }
  }, [isDragging, minHeight, midHeight, maxHeight]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: true });
      document.addEventListener("touchend", handleEnd);
    } else {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    }

    return () => {
      // Clean up animation frame on unmount
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
      }
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const isContentVisible = height > minHeight;

  return {
    sheetRef,
    height,
    isDragging,
    isContentVisible,
    handleDragStart,
  };
}
