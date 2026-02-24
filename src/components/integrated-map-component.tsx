"use client";

import TopSearchAndCategories from "@/components/top-search-and-categories";
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { getPlaces, getAccidents, type Place } from "@/app/actions/places";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Accident } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LOCATION_TYPES } from "@/lib/constants";
import { usePerformanceMonitoring, useWebVitals } from "@/hooks/usePerformanceMonitoring";

// Lazy load heavy components for better performance
const LazyKakaoMap = lazy(() => import("@/components/kakao-map"));
const LazyAccidentOverlay = lazy(() => import("./accident-overlay"));
const LazyAccidentDetailModal = lazy(() => import("./accident-detail-modal"));

// Map loading component
function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 text-sm">지도를 불러오는 중...</p>
      </div>
    </div>
  );
}

const placeCategoryIds = ["tourist_spot", "festival"];
const accidentCategoryId = "accident_location";

export default function IntegratedMapComponent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [currentCategories, setCurrentCategories] = useState<string[]>([
    "tourist_spot",
    "festival",
  ]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 36.5,
    lng: 127.5,
  });
  const [showSearchButton, setShowSearchButton] = useState(false);

  // Performance monitoring hooks
  const { startMeasure, endMeasure, recordCacheHit, logPerformanceReport } = usePerformanceMonitoring();
  const { getWebVitals } = useWebVitals();

  const loadData = useCallback(
    async (
      categories: string[],
      center: { lat: number; lng: number },
      searchQuery?: string
    ) => {
      startMeasure('searchResponseTime');
      setLoading(true);

      const placeCategoriesToFetch = categories
        .filter((cat) => placeCategoryIds.includes(cat))
        .map(
          (cat) =>
            LOCATION_TYPES[cat.toUpperCase() as keyof typeof LOCATION_TYPES]
        );

      const shouldFetchAccidents = categories.includes(accidentCategoryId);

      const placesPromise =
        placeCategoriesToFetch.length > 0
          ? getPlaces(placeCategoriesToFetch, searchQuery)
          : Promise.resolve({ success: true, data: [] });

      const accidentsPromise = shouldFetchAccidents
        ? getAccidents(String(center.lat), String(center.lng), "5000")
        : Promise.resolve({ success: true, data: [] });

      const [placesResult, accidentsResult] = await Promise.all([
        placesPromise,
        accidentsPromise,
      ]);

      // Record cache performance
      if (placesResult.success) {
        recordCacheHit(true);
        setPlaces(placesResult.data);
      } else {
        recordCacheHit(false);
      }

      if (accidentsResult.success) {
        recordCacheHit(true);
        setAccidents(accidentsResult.data);
      } else {
        recordCacheHit(false);
      }

      setLoading(false);
      setShowSearchButton(false);
      
      const responseTime = endMeasure('searchResponseTime');
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Search completed in ${responseTime.toFixed(2)}ms`);
      }
    },
    [startMeasure, endMeasure, recordCacheHit]
  );

  // Handle map load performance
  const handleMapLoad = useCallback(() => {
    const loadTime = endMeasure('mapLoadTime');
    if (process.env.NODE_ENV === 'development') {
      console.log(`📍 Map loaded in ${loadTime.toFixed(2)}ms`);
      logPerformanceReport();
    }
  }, [endMeasure, logPerformanceReport]);

  // Start map load measurement on component mount
  useEffect(() => {
    startMeasure('mapLoadTime');
    loadData(currentCategories, mapCenter);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setCurrentSearchQuery(query);
    setSelectedPlace(null);
    setCurrentCategories([]);
    loadData([], mapCenter, query);
  }, [loadData, mapCenter]);

  const handleCategorySelect = useCallback((categories: string[]) => {
    setCurrentCategories(categories);
    setSelectedPlace(null);
    setSelectedAccident(null);
    setCurrentSearchQuery("");
    loadData(categories, mapCenter);
  }, [loadData, mapCenter]);

  const handleMapMove = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      setMapCenter(newCenter);
      setShowSearchButton(true);
    },
    []
  );

  const handleSelectPlaceFromList = useCallback((place: Place) => {
    setSelectedPlace(place);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleSearchFocusChange = useCallback((focused: boolean) => {
    setIsSearchFocused(focused);
  }, []);

  // Memoized sorted places for performance
  const sortedPlaces = places.sort((a, b) => {
    if (a.rating && b.rating) {
      return b.rating - a.rating;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 right-4 z-20">
        <TopSearchAndCategories
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          onFocusChange={handleSearchFocusChange}
          initialSelectedCategories={currentCategories}
        />
      </div>

      {showSearchButton && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            onClick={() => loadData(currentCategories, mapCenter)}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-md"
            disabled={loading}
          >
            {loading ? "검색 중..." : "이 지역에서 검색"}
          </Button>
        </div>
      )}

      <div className="w-full h-full">
        <Suspense fallback={<MapLoadingSkeleton />}>
          <LazyKakaoMap
            places={sortedPlaces}
            accidents={accidents}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            onSelectAccident={(accident) => {
              setSelectedAccident(accident);
              setIsDetailModalOpen(true);
            }}
            onMapMove={handleMapMove}
            center={mapCenter}
            onMapLoad={handleMapLoad}
          />
        </Suspense>
      </div>

      <PlaceDetailBottomSheet
        places={sortedPlaces}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlaceFromList}
        onBackToList={handleBackToList}
        isSearchFocused={isSearchFocused}
      />

      <Suspense fallback={null}>
        {selectedAccident && (
          <LazyAccidentOverlay
            accident={selectedAccident}
            onClose={() => setSelectedAccident(null)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <LazyAccidentDetailModal
          accident={selectedAccident}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAccident(null);
          }}
        />
      </Suspense>

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600 text-sm">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}