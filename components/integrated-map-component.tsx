"use client";

import { MapPin, Star } from "lucide-react";
import TopSearchAndCategories from "@/components/top-search-and-categories";
import PlaceDetailBottomSheet from "@/components/place-detail-bottom-sheet";
import KakaoMap from "@/components/kakao-map";
import { useState, useEffect, useCallback } from "react";
import { getPlaces, getAccidents, type Place } from "@/app/actions/places";
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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 36.5,
    lng: 127.5,
  });

  const loadPlaces = useCallback(
    async (category?: string, searchQuery?: string) => {
      setLoading(true);
      if (category !== "accident_location") {
        const result = await getPlaces(category, searchQuery);
        if (result.success) {
          setPlaces(result.data);
        }
        setAccidents([]);
      } else {
        setPlaces([]);
        // 사고 위치 카테고리 선택 시, 현재 지도 중심으로 사고 데이터 로드
        await loadAccidents(mapCenter.lat, mapCenter.lng);
      }
      setLoading(false);
    },
    [mapCenter.lat, mapCenter.lng]
  );

  const loadAccidents = async (lat: number, lon: number) => {
    setLoading(true);
    const result = await getAccidents(String(lat), String(lon), "5000"); // 5km 반경
    if (result.success) {
      setAccidents(result.data);
    } else {
      console.error("Failed to fetch accident data:", result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlaces(
      currentCategory === "all" ? undefined : currentCategory,
      currentSearchQuery
    );
  }, [loadPlaces, currentCategory, currentSearchQuery]);

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    setSelectedPlace(null);
    setCurrentCategory("all");
  };

  const handleCategorySelect = (category: string) => {
    setCurrentCategory(category);
    setSelectedPlace(null);
    setCurrentSearchQuery("");
    if (category === "accident_location") {
      loadAccidents(mapCenter.lat, mapCenter.lng);
    } else {
      setAccidents([]);
    }
  };

  const handleAccidentDataLoad = (data: Accident[]) => {
    setLoading(true);
    setAccidents(data);
    setPlaces([]);
    setLoading(false);
  };

  const handleMapIdle = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      setMapCenter(newCenter);
      if (currentCategory === "accident_location") {
        loadAccidents(newCenter.lat, newCenter.lng);
      }
    },
    [currentCategory]
  );

  const goToCurrentUserLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newCenter);
          if (currentCategory === "accident_location") {
            loadAccidents(newCenter.lat, newCenter.lng);
          }
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

  useEffect(() => {
    goToCurrentUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0">
      <KakaoMap
        places={places}
        accidents={accidents}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
        onMapIdle={handleMapIdle}
        center={mapCenter}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-30">
          <LoadingSpinner />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <TopSearchAndCategories
          onSearch={handleSearch}
          onCategorySelect={handleCategorySelect}
          onFocusChange={handleSearchFocusChange}
          onAccidentDataLoad={handleAccidentDataLoad}
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
