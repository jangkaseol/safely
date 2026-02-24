"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchPlaceNames } from "@/app/actions/places";
import {
  STATIC_CATEGORIES,
  PLACE_CATEGORY_IDS,
  ACCIDENT_CATEGORY_ID,
} from "@/lib/map-constants";

interface TopSearchAndCategoriesProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (categories: string[]) => void;
  onFocusChange?: (focused: boolean) => void;
  initialSelectedCategories?: string[];
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
  initialSelectedCategories = [],
}: TopSearchAndCategoriesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories] = useState([...STATIC_CATEGORIES]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSelectedCategories
  );
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    onFocusChange?.(isInputFocused);
  }, [isInputFocused, onFocusChange]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsSearching(true);

    try {
      const result = await searchPlaceNames(query, 5);

      // Check if request was aborted
      if (signal.aborted) return;

      if (result.success) {
        setSuggestions(result.data as any);
      } else {
        setSuggestions([]);
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name === 'AbortError') return;

      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    // Increased debounce time from 150ms to 400ms for better performance
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      // Cancel ongoing request when component unmounts or query changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Clean up any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
      const allCategoryIds = [...PLACE_CATEGORY_IDS, ACCIDENT_CATEGORY_ID];
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
      className="w-full bg-white shadow-md z-20 px-4 pt-4 pb-1.5 rounded-none"
    >
      {/* 검색 입력창 */}
      <div className="relative">
        <div
          className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-200 mb-3"
          onClick={() => inputRef.current?.focus()}
        >
          <Input
            ref={inputRef}
            type="text"
            inputMode="text"
            enterKeyHint="search"
            placeholder="장소, 버스, 지하철, 주소 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            role="combobox"
            aria-label="장소 검색"
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {isInputFocused &&
          searchQuery.trim().length > 0 &&
          suggestions.length > 0 && (
            <div
              role="listbox"
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  role="option"
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

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const allCategoryIds = [...PLACE_CATEGORY_IDS, ACCIDENT_CATEGORY_ID];
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
                  ? "bg-gray-900 text-white hover:bg-gray-800"
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
    </div>
  );
}
