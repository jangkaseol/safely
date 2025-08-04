"use client"

import { MapPin, Star } from "lucide-react"
import TopSearchAndCategories from "@/components/top-search-and-categories"
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet"
import { useState, useEffect, useCallback } from "react"
import { getPlaces, type Place } from "@/app/actions/places"

export default function IntegratedMapComponent() {
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("")
  const [currentCategory, setCurrentCategory] = useState<string>("all")
  const [isSearchFocused, setIsSearchFocused] = useState(false) // 검색 포커스 상태 추가

  // 데이터 로드 함수
  const loadPlaces = useCallback(async (category?: string, searchQuery?: string) => {
    setLoading(true)
    const result = await getPlaces(category, searchQuery)
    if (result.success) {
      setPlaces(result.data)
    }
    setLoading(false)
  }, [])

  // 초기 데이터 로드 및 검색/카테고리 변경 시 데이터 로드
  useEffect(() => {
    loadPlaces(currentCategory === "all" ? undefined : currentCategory, currentSearchQuery)
  }, [loadPlaces, currentCategory, currentSearchQuery])

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query)
    setSelectedPlace(null)
  }

  const handleCategorySelect = (category: string) => {
    setCurrentCategory(category)
    setSelectedPlace(null)
  }

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place)
  }

  const handleBackToList = () => {
    setSelectedPlace(null)
  }

  // 검색 포커스 상태 변경 핸들러
  const handleSearchFocusChange = (focused: boolean) => {
    setIsSearchFocused(focused)
  }

  return (
    <div className="relative w-full flex-1 bg-gray-200 flex flex-col">
      {/* 지도 플레이스홀더 */}
      <div className="flex-1 bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
        {loading ? "데이터 로딩 중..." : `네이버 지도 (${places.length}개 장소)`}
      </div>

      {/* 상단 검색창 및 카테고리 */}
      <TopSearchAndCategories
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
        onFocusChange={handleSearchFocusChange} // 포커스 변경 콜백 추가
      />

      {/* 플로팅 액션 버튼 (임시) */}
      <div className="absolute top-[250px] right-4 flex flex-col gap-2 z-10">
        <button className="bg-white p-3 rounded-full shadow-md">
          <MapPin className="w-5 h-5 text-gray-700" />
        </button>
        <button className="bg-white p-3 rounded-full shadow-md">
          <Star className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* 장소 상세 정보 바텀 시트 */}
      <PlaceDetailBottomSheet
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
        onBackToList={handleBackToList}
        isSearchFocused={isSearchFocused} // 검색 포커스 상태 전달
      />
    </div>
  )
}
