"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils" // cn 유틸리티 함수 사용

interface PlaceInfo {
  name: string
  address: string
  description: string
}

interface BottomInfoSheetProps {
  isOpen: boolean
  onClose: () => void
  placeInfo: PlaceInfo
}

export default function BottomInfoSheet({ isOpen, onClose, placeInfo }: BottomInfoSheetProps) {
  const [currentTranslateY, setCurrentTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // 시트가 열리거나 닫힐 때 위치 초기화
  useEffect(() => {
    if (!isOpen) {
      setCurrentTranslateY(0) // 다음 열림을 위해 초기화
    }
  }, [isOpen])

  // 터치 시작 (모바일)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!sheetRef.current) return
    setIsDragging(true)
    startY.current = e.touches[0].clientY
    sheetRef.current.style.transition = "none" // 드래그 중 트랜지션 비활성화
  }, [])

  // 터치 이동 (모바일)
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY.current
      const newTranslateY = Math.max(0, deltaY) // 아래로만 드래그 허용

      setCurrentTranslateY(newTranslateY)
    },
    [isDragging],
  )

  // 터치 끝 (모바일)
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)
    sheetRef.current!.style.transition = "transform 0.3s ease-out" // 트랜지션 다시 활성화

    const sheetHeight = sheetRef.current?.clientHeight || 0
    const dragThreshold = sheetHeight * 0.3 // 시트 높이의 30% 이상 드래그 시 닫기

    if (currentTranslateY > dragThreshold) {
      onClose()
    } else {
      setCurrentTranslateY(0) // 열린 위치로 스냅 백
    }
  }, [isDragging, currentTranslateY, onClose])

  // 마우스 시작 (데스크탑)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!sheetRef.current) return
    setIsDragging(true)
    startY.current = e.clientY
    sheetRef.current.style.transition = "none"
  }, [])

  // 마우스 이동 (데스크탑)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      e.preventDefault() // 텍스트 선택 등 기본 동작 방지
      const currentY = e.clientY
      const deltaY = currentY - startY.current
      const newTranslateY = Math.max(0, deltaY)
      setCurrentTranslateY(newTranslateY)
    },
    [isDragging],
  )

  // 마우스 끝 (데스크탑)
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    sheetRef.current!.style.transition = "transform 0.3s ease-out"

    const sheetHeight = sheetRef.current?.clientHeight || 0
    const dragThreshold = sheetHeight * 0.3

    if (currentTranslateY > dragThreshold) {
      onClose()
    } else {
      setCurrentTranslateY(0)
    }
  }, [isDragging, currentTranslateY, onClose])

  // 마우스 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-lg flex flex-col h-1/2 max-h-[80vh]", // 시트 높이 설정
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full",
        isDragging && "transition-none", // 드래그 중 트랜지션 비활성화
      )}
      style={{ transform: `translateY(${currentTranslateY}px)` }}
    >
      {/* 드래그 핸들 */}
      <div
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-8 h-8 text-gray-400" />
      </div>

      {/* 닫기 버튼 */}
      <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={onClose}>
        <X className="w-5 h-5" />
      </Button>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-6 pt-0">
        <h2 className="text-2xl font-bold mb-2">{placeInfo.name}</h2>
        <p className="text-gray-600 mb-4">{placeInfo.address}</p>
        <p className="text-gray-700">{placeInfo.description}</p>
        {/* 추가 정보 */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">상세 정보</h3>
          <p>안전 등급: A+</p>
          <p>최근 사고 기록: 없음</p>
          <p>주변 시설: 병원, 소방서, 대피소</p>
          <p>연락처: 02-1234-5678</p>
        </div>
      </div>
    </div>
  )
}
