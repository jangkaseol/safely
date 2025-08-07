"use client";

import { MapPin, Star, RefreshCw } from "lucide-react";
import TopSearchAndCategories from "@/components/top-search-and-categories";
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet";
import KakaoMap from "@/components/kakao-map";
import { useState, useEffect, useCallback } from "react";
import { getPlaces, getAccidents, type Place } from "@/app/actions/places";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Accident } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LOCATION_TYPES } from "@/lib/constants";
import AccidentOverlay from "./accident-overlay";
import AccidentDetailModal from "./accident-detail-modal";

const placeCategoryIds = ["tourist_spot", "festival"];
const accidentCategoryId = "accident_location";

export default function IntegratedMapComponent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(
    null
  );
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

  const loadData = useCallback(
    async (
      categories: string[],
      center: { lat: number; lng: number },
      searchQuery?: string
    ) => {
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

      if (placesResult.success) {
        setPlaces(placesResult.data);
      }
      if (accidentsResult.success) {
        setAccidents(accidentsResult.data);
      }

      setLoading(false);
      setShowSearchButton(false);
    },
    []
  );

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    setSelectedPlace(null);
    setCurrentCategories([]);
    loadData([], mapCenter, query);
  };

  const handleCategorySelect = (categories: string[]) => {
    setCurrentCategories(categories);
    setSelectedPlace(null);
    setSelectedAccident(null);
    setCurrentSearchQuery("");
    loadData(categories, mapCenter);
  };

  const handleMapMove = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      setMapCenter(newCenter);
      setShowSearchButton(true);
    },
    []
  );

  const handleSearchInMap = () => {
    loadData(currentCategories, mapCenter, currentSearchQuery);
  };

  const goToCurrentUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newCenter);
          loadData(currentCategories, newCenter, currentSearchQuery);
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("위치 정보를 가져올 수 없습니다.");
          setLoading(false);
        }
      );
    } else {
      alert("이 브라우저에서는 위치 정보가 지원되지 않습니다.");
    }
  }, [currentCategories, currentSearchQuery, loadData]);

  useEffect(() => {
    goToCurrentUserLocation();
  }, [goToCurrentUserLocation]);

  const handleSelectPlace = (place: Place | null) => {
    setSelectedPlace(place);
    setSelectedAccident(null);
  };

  const handleSelectAccident = (accident: Accident | null) => {
    setSelectedAccident(accident);
    if (accident) {
      setSelectedPlace(null);
    }
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

  return (
    <div className="absolute inset-0">
      <KakaoMap
        places={places}
        accidents={accidents}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
        onSelectAccident={handleSelectAccident}
        onMapMove={handleMapMove}
        center={mapCenter}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-30">
          <LoadingSpinner />
        </div>
      )}

      {selectedAccident && (
        <AccidentOverlay
          accident={selectedAccident}
          onClose={() => setSelectedAccident(null)}
          onMoreInfo={() => setIsDetailModalOpen(true)}
        />
      )}

      <AccidentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        accident={selectedAccident}
      />

      {showSearchButton && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={handleSearchInMap}
            className="rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> 현 지도에서 검색
          </Button>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <TopSearchAndCategories
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          onFocusChange={handleSearchFocusChange}
          initialSelectedCategories={currentCategories}
        />
      </div>

      <div className="absolute top-[120px] right-4 z-10 flex flex-col gap-2">
        <button
          onClick={goToCurrentUserLocation}
          className="rounded-full bg-white p-3 shadow-md"
        >
          <MapPin className="h-5 w-5 text-gray-700" />
        </button>
        <button className="rounded-full bg-white p-3 shadow-md">
          <Star className="h-5 w-5 text-gray-700" />
        </button>
      </div>

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
