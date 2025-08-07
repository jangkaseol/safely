"use client";

import { MapPin, Star } from "lucide-react";
import TopSearchAndCategories from "@/components/top-search-and-categories";
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet";
import KakaoMap from "@/components/kakao-map";
import { useState, useEffect, useCallback } from "react";
import { getPlaces, type Place } from "@/app/actions/places";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Accident } from "@/lib/types";

export default function IntegratedMapComponent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const loadPlaces = useCallback(
    async (category?: string, searchQuery?: string) => {
      setLoading(true);
      // "사고 위치"가 아닐 때만 장소 데이터를 불러옵니다.
      if (category !== "accident_location") {
        const result = await getPlaces(category, searchQuery);
        if (result.success) {
          setPlaces(result.data);
        }
        setAccidents([]); // 장소 검색 시 사고 데이터는 비웁니다.
      } else {
        setPlaces([]); // 사고 위치 검색 시 장소 데이터는 비웁니다.
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    loadPlaces(
      currentCategory === "all" ? undefined : currentCategory,
      currentSearchQuery
    );
  }, [loadPlaces, currentCategory, currentSearchQuery]);

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    setSelectedPlace(null);
    setCurrentCategory("all"); // 검색 시 카테고리를 '전체'로 초기화
  };

  const handleCategorySelect = (category: string) => {
    setCurrentCategory(category);
    setSelectedPlace(null);
    setCurrentSearchQuery(""); // 카테고리 변경 시 검색어 초기화
  };

  const handleAccidentDataLoad = (data: Accident[]) => {
    setLoading(true);
    setAccidents(data);
    setPlaces([]); // 사고 데이터 로드 시 장소 목록 초기화
    setLoading(false);
  };

  const handleSelectPlace = (place: Place | null) => {
    setSelectedPlace(place);
  };

  const handleSelectPlaceFromList = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleBackToList = () => {
    setSelectedPlace(null);
  };

  const sortedPlaces = selectedPlace
    ? [selectedPlace, ...places.filter((p) => p.id !== selectedPlace.id)]
    : places;

  const handleSearchFocusChange = (focused: boolean) => {
    setIsSearchFocused(focused);
  };

  // This layout makes the component itself an absolute layer inside its parent from app/page.tsx.
  // This bypasses all flexbox height calculation issues and guarantees the map has a space to render in.
  return (
    <div className="absolute inset-0">
      {/* Map is at the bottom of the stack, filling the entire space */}
      <KakaoMap
        places={places}
        accidents={accidents}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
      />

      {/* Loading overlay, on top of the map */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-30">
          <LoadingSpinner />
        </div>
      )}

      {/* UI elements layered on top of the map with z-index */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <TopSearchAndCategories
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          onFocusChange={handleSearchFocusChange}
          onAccidentDataLoad={handleAccidentDataLoad}
        />
      </div>

      <div className="absolute top-[120px] right-4 z-10 flex flex-col gap-2">
        <button className="rounded-full bg-white p-3 shadow-md">
          <MapPin className="h-5 w-5 text-gray-700" />
        </button>
        <button className="rounded-full bg-white p-3 shadow-md">
          <Star className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Bottom sheet uses 'fixed' positioning, so it's managed separately by the browser viewport. */}
      <PlaceDetailBottomSheet
        places={sortedPlaces}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlaceFromList}
        onBackToList={handleBackToList}
        isSearchFocused={isSearchFocused}
      />
    </div>
  );
}
