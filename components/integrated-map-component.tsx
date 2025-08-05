"use client";

import { MapPin, Star } from "lucide-react";
import TopSearchAndCategories from "@/components/top-search-and-categories";
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet";
import KakaoMap from "@/components/kakao-map";
import { useState, useEffect, useCallback } from "react";
import { getPlaces, type Place } from "@/app/actions/places";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function IntegratedMapComponent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const loadPlaces = useCallback(
    async (category?: string, searchQuery?: string) => {
      setLoading(true);
      const result = await getPlaces(category, searchQuery);
      if (result.success) {
        setPlaces(result.data);
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
  };

  const handleCategorySelect = (category: string) => {
    setCurrentCategory(category);
    setSelectedPlace(null);
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
