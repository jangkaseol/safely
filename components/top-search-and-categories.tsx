"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchPlaceNames } from "@/app/actions/places";

// 변경된 카테고리 목록 정의
const staticCategories = [
  { id: "all", name: "전체" },
  { id: "tourist_spot", name: "관광지" },
  { id: "festival", name: "축제" },
  { id: "accident_location", name: "사고 위치" },
];

const placeCategoryIds = ["tourist_spot", "festival"];
const accidentCategoryId = "accident_location";

interface TopSearchAndCategoriesProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (categories: string[]) => void;
  onFocusChange?: (focused: boolean) => void;
}

interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
}

export default function TopSearchAndCategories({
  onSearch,
  onCategorySelect,
  onFocusChange,
}: TopSearchAndCategoriesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories] = useState(staticCategories);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onFocusChange?.(isInputFocused);
  }, [isInputFocused, onFocusChange]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const result = await searchPlaceNames(query, 5);
      if (result.success) {
        setSuggestions(result.data as any);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    onSearch?.(searchTerm);
    setIsInputFocused(false);
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name);
    handleSearch(suggestion.name);
  };

  const handleCategoryClick = (categoryId: string) => {
    let newSelectedCategories: string[];

    if (categoryId === "all") {
      const allCategoryIds = [...placeCategoryIds, accidentCategoryId];
      // 모든 카테고리가 이미 선택되어 있는지 확인
      const areAllSelected =
        allCategoryIds.every((id) => selectedCategories.includes(id)) &&
        selectedCategories.length === allCategoryIds.length;

      newSelectedCategories = areAllSelected ? [] : allCategoryIds;
    } else {
      if (selectedCategories.includes(categoryId)) {
        newSelectedCategories = selectedCategories.filter(
          (id) => id !== categoryId
        );
      } else {
        newSelectedCategories = [...selectedCategories, categoryId];
      }
    }

    setSelectedCategories(newSelectedCategories);
    onCategorySelect?.(newSelectedCategories);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        setIsInputFocused(false);
      }
    }, 150);
  };

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

        {isInputFocused &&
          searchQuery.trim().length > 0 &&
          suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="font-medium text-gray-900">
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {suggestion.location}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {isInputFocused && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const allCategoryIds = [...placeCategoryIds, accidentCategoryId];
            const areAllSelected =
              allCategoryIds.every((id) => selectedCategories.includes(id)) &&
              selectedCategories.length === allCategoryIds.length;
            const isSelected =
              selectedCategories.includes(category.id) ||
              (category.id === "all" && areAllSelected);

            return (
              <Button
                key={category.id}
                className={cn(
                  "rounded-full whitespace-nowrap shadow-sm",
                  isSelected
                    ? category.id === accidentCategoryId
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
