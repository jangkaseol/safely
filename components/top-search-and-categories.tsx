"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchPlaceNames } from "@/app/actions/places"

// 고정된 카테고리 목록 정의
const staticCategories = [
  { id: "all", name: "전체", isAccident: false },
  { id: "accident_location", name: "사고 위치", isAccident: true },
  { id: "tourist_spot", name: "관광지", isAccident: false },
  { id: "festival", name: "축제", isAccident: false },
]

interface TopSearchAndCategoriesProps {
  onSearch?: (query: string) => void
  onCategorySelect?: (category: string) => void
  onFocusChange?: (focused: boolean) => void // 포커스 변경 콜백 추가
}

interface SearchSuggestion {
  id: string
  name: string
  location: string
}

export default function TopSearchAndCategories({
  onSearch,
  onCategorySelect,
  onFocusChange,
}: TopSearchAndCategoriesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categories] = useState(staticCategories)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 포커스 상태 변경 시 부모에게 알림
  useEffect(() => {
    onFocusChange?.(isInputFocused)
  }, [isInputFocused, onFocusChange])

  // 실시간 검색 자동완성
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSuggestions([])
      return
    }

    try {
      const result = await searchPlaceNames(query, 5)
      if (result.success) {
        setSuggestions(result.data)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
    }
  }, [])

  // 검색어 변경 시 자동완성 실행
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchSuggestions])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsInputFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery
    console.log("검색:", searchTerm)
    onSearch?.(searchTerm)
    setIsInputFocused(false) // 검색 후 포커스 해제
    inputRef.current?.blur()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name)
    handleSearch(suggestion.name)
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    onCategorySelect?.(categoryId)
  }

  const handleInputFocus = () => {
    setIsInputFocused(true)
  }

  const handleInputBlur = () => {
    // 약간의 지연을 두어 자동완성 클릭이 가능하도록 함
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setIsInputFocused(false)
      }
    }, 150)
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-[64px] left-0 right-0 bg-white shadow-md z-20 px-4 pt-4 pb-1.5 rounded-none"
    >
      {/* 검색 입력창 */}
      <div className="relative">
        <div
          className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 mb-3"
          onClick={() => inputRef.current?.focus()}
        >
          <Menu className="w-5 h-5 text-gray-600" />
          <Input
            ref={inputRef}
            type="text"
            inputMode="text"
            enterKeyHint="search"
            placeholder="장소, 버스, 지하철, 주소 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Mic className="w-5 h-5 text-gray-600" />
        </div>

        {/* 자동완성 드롭다운 - 포커스가 있고 검색어가 있고 결과가 있을 때만 표시 */}
        {isInputFocused && searchQuery.trim().length > 0 && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onMouseDown={(e) => e.preventDefault()} // 클릭 시 blur 방지
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-sm text-gray-500 mt-1">{suggestion.location}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리 필터 - 포커스가 있을 때만 표시 */}
      {isInputFocused && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              className={cn(
                "rounded-full whitespace-nowrap shadow-sm",
                selectedCategory === category.id
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
              )}
              onMouseDown={(e) => e.preventDefault()} // 클릭 시 blur 방지
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
