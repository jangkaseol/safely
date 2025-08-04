"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Star, Calendar, Users, ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import type { Place } from "@/app/actions/places"
import AIChatSheet from "@/components/ai-chat-sheet"

interface PlaceDetailBottomSheetProps {
  places: Place[]
  selectedPlace: Place | null
  onSelectPlace: (place: Place) => void
  onBackToList: () => void
  isSearchFocused: boolean // 검색 포커스 상태 prop 추가
}

export default function PlaceDetailBottomSheet({
  places,
  selectedPlace,
  onSelectPlace,
  onBackToList,
  isSearchFocused, // 검색 포커스 상태 받기
}: PlaceDetailBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const initialSheetHeight = useRef(0)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  // 스냅 포인트 정의 (픽셀 단위)
  const minHeight = 80 // 드래그 핸들만 보이는 최소 높이
  const midHeight = typeof window !== "undefined" ? window.innerHeight * 0.4 : 300 // 중간 높이
  // 헤더(64px) + 접힌 카테고리 필터(약 100px) 높이를 제외한 최대 확장 높이
  const maxHeight = typeof window !== "undefined" ? window.innerHeight - 164 : 600

  // 현재 시트 높이 상태
  const [height, setHeight] = useState(minHeight)

  // 검색 포커스 상태가 변경될 때 모달 높이 조정
  useEffect(() => {
    if (isSearchFocused) {
      // 검색창에 포커스가 가면 모달을 최소 높이로 내림
      setHeight(minHeight)
    }
  }, [isSearchFocused, minHeight])

  // 드래그 시작
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sheetRef.current) return
    setIsDragging(true)
    startY.current = "touches" in e ? e.touches[0].clientY : e.clientY
    initialSheetHeight.current = sheetRef.current.clientHeight
    sheetRef.current.style.transition = "none" // 드래그 중 트랜지션 비활성화
  }, [])

  // 드래그 이동
  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const currentY = "touches" in e ? e.touches[0].clientY : e.clientY
      const deltaY = currentY - startY.current // 아래로 드래그 시 양수

      let newHeight = initialSheetHeight.current - deltaY // 아래로 드래그 시 높이 감소

      // 높이를 minHeight부터 maxHeight까지 제한
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
      setHeight(newHeight)
    },
    [isDragging, minHeight, maxHeight],
  )

  // 드래그 끝 - 스냅 포인트로 이동
  const handleEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)
    sheetRef.current!.style.transition = "height 0.3s ease-out"

    const currentHeight = sheetRef.current!.clientHeight

    let snapHeight = minHeight
    if (currentHeight < (minHeight + midHeight) / 2) {
      snapHeight = minHeight
    } else if (currentHeight < (midHeight + maxHeight) / 2) {
      snapHeight = midHeight
    } else {
      snapHeight = maxHeight
    }

    setHeight(snapHeight)
  }, [isDragging, minHeight, midHeight, maxHeight])

  // 마우스/터치 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMove)
      document.addEventListener("mouseup", handleEnd)
      document.addEventListener("touchmove", handleMove, { passive: false })
      document.addEventListener("touchend", handleEnd)
    } else {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchmove", handleMove)
      document.removeEventListener("touchend", handleEnd)
    }
    return () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchmove", handleMove)
      document.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, handleMove, handleEnd])

  // 높이가 minHeight보다 크면 내용과 닫기 버튼을 표시
  const isContentVisible = height > minHeight

  // 닫기 버튼 클릭 시 완전히 닫힘 (minHeight로)
  const handleClose = useCallback(() => {
    setHeight(minHeight)
    onBackToList()
  }, [onBackToList, minHeight])

  // Place 데이터를 PlaceInfo 형태로 변환 (상세 보기용)
  const placeInfo = selectedPlace
    ? {
        name: selectedPlace.name,
        address: selectedPlace.address,
        imageUrl: selectedPlace.image_url || "",
        rating: selectedPlace.rating?.toString() || "N/A",
        period:
          selectedPlace.period_start && selectedPlace.period_end
            ? `${selectedPlace.period_start} ~ ${selectedPlace.end_date}` // end_date로 수정
            : "N/A",
        visitors: selectedPlace.visitors?.toString() || "N/A",
        aiAnalysisTitle: selectedPlace.ai_analysis_title || "안전 분석 정보 없음",
        aiAnalysisContent:
          selectedPlace.ai_analysis_content || "해당 장소에 대한 안전 분석 정보가 아직 준비되지 않았습니다.",
        description: selectedPlace.description, // AI 컨텍스트를 위해 description 추가
      }
    : null

  // 새로운 여행지 등록 버튼 클릭 핸들러 (임시)
  const handleRegisterNewPlace = () => {
    alert("새로운 여행지 등록하기 기능은 아직 구현되지 않았습니다.")
    // 여기에 장소 등록 페이지로 이동하거나 모달을 여는 로직을 추가할 수 있습니다.
  }

  const handleAskAI = () => {
    if (selectedPlace) {
      setIsAIChatOpen(true)
    }
  }

  return (
    <>
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-lg flex flex-col z-30",
          "transition-transform duration-300 ease-out",
          isDragging && "transition-none",
        )}
        style={{ height: `${height}px` }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 내용 스크롤 영역 (내용이 보일 때만 표시) */}
        {isContentVisible && (
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {selectedPlace ? (
              // 상세 보기 (기존 로직 유지)
              <>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={onBackToList} className="-ml-2">
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <h2 className="text-2xl font-bold flex-1 text-center pr-8">{placeInfo?.name}</h2>
                </div>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-sm">{placeInfo?.address}</span>
                </div>

                {/* 상세 정보 - 이 부분은 상세 보기에서만 유지됩니다. */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">상세 정보</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>평점: {placeInfo?.rating}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>방문객 수: {placeInfo?.visitors}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-full">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>기간: {placeInfo?.period}</span>
                    </div>
                  </div>
                </div>

                {/* 이미지 */}
                <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-6">
                  <img
                    src={placeInfo?.imageUrl || "/placeholder.svg?height=192&width=384&text=Place Image"}
                    alt={placeInfo?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* AI 안전 분석 */}
                <Accordion type="single" collapsible defaultValue="item-1">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold py-3">AI 안전 분석</AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <h4 className="text-xl font-bold mb-2">{placeInfo?.aiAnalysisTitle}</h4>
                      <p className="text-gray-700 leading-relaxed">{placeInfo?.aiAnalysisContent}</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* AI에게 질문하기 버튼 추가 */}
                <Button onClick={handleAskAI} className="w-full mt-6">
                  AI에게 질문하기
                </Button>
              </>
            ) : (
              // 목록 보기 - 이 부분에 평점, 방문객 수, 기간 정보를 추가합니다.
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">여행지 목록</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegisterNewPlace}
                    className="flex items-center gap-1 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새로운 여행지 등록하기</span>
                  </Button>
                </div>
                {places.length > 0 ? (
                  places.map((place) => (
                    <Card
                      key={place.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => onSelectPlace(place)}
                    >
                      <div className="relative">
                        <img
                          src={place.image_url || "/placeholder.svg?height=150&width=250&text=Place Image"}
                          alt={place.name}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{place.address}</span>
                        </div>
                        {/* 여기에 평점, 방문객 수, 기간 정보를 추가합니다. */}
                        <div className="flex items-center gap-3 text-xs text-gray-700 mb-2">
                          {place.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>{place.rating}</span>
                            </div>
                          )}
                          {place.visitors && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span>{place.visitors}</span>
                            </div>
                          )}
                          {place.period_start && place.period_end && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-purple-500" />
                              <span>{`${place.period_start} ~ ${place.period_end}`}</span>
                            </div>
                          )}
                        </div>
                        {place.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{place.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500">검색 결과가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Chat Sheet */}
      {placeInfo && (
        <AIChatSheet
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          placeInfo={{
            name: placeInfo.name,
            address: placeInfo.address,
            description: placeInfo.description,
          }}
        />
      )}
    </>
  )
}
