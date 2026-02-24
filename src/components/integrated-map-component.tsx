"use client";

import TopSearchAndCategories from "@/components/top-search-and-categories";
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useMapData } from "@/hooks/useMapData";

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

export default function IntegratedMapComponent() {
  const {
    sortedPlaces,
    accidents,
    selectedPlace,
    setSelectedPlace,
    selectedAccident,
    setSelectedAccident,
    isDetailModalOpen,
    handleSelectAccident,
    handleCloseDetailModal,
    isLoading,
    showSearchButton,
    isSearchFocused,
    setIsSearchFocused,
    currentCategories,
    mapCenter,
    handleMapMove,
    handleSearch,
    handleCategorySelect,
    handleSearchInArea,
  } = useMapData();

  return (
    <div className="relative w-full h-full min-h-0">
      <div className="absolute top-4 left-4 right-4 z-20">
        <TopSearchAndCategories
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          onFocusChange={setIsSearchFocused}
          initialSelectedCategories={currentCategories}
        />
      </div>

      {showSearchButton && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            onClick={handleSearchInArea}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-md"
            disabled={isLoading}
          >
            {isLoading ? "검색 중..." : "이 지역에서 검색"}
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
            onSelectAccident={handleSelectAccident}
            onMapMove={handleMapMove}
            center={mapCenter}
          />
        </Suspense>
      </div>

      <PlaceDetailBottomSheet
        places={sortedPlaces}
        selectedPlace={selectedPlace}
        onSelectPlace={setSelectedPlace}
        onBackToList={() => setSelectedPlace(null)}
        isSearchFocused={isSearchFocused}
      />

      <Suspense fallback={null}>
        {selectedAccident && (
          <LazyAccidentOverlay
            accident={selectedAccident}
            onClose={() => setSelectedAccident(null)}
            onMoreInfo={() => handleSelectAccident(selectedAccident)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <LazyAccidentDetailModal
          accident={selectedAccident}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
        />
      </Suspense>

      {isLoading && (
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
