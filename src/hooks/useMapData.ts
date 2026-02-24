"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getPlaces, getAccidents, type Place } from "@/app/actions/places";
import { Accident } from "@/lib/types";
import { LOCATION_TYPES } from "@/lib/constants";
import {
  PLACE_CATEGORY_IDS,
  ACCIDENT_CATEGORY_ID,
  DEFAULT_MAP_CENTER,
  DEFAULT_ACCIDENT_RADIUS,
} from "@/lib/map-constants";

interface MapDataState {
  places: Place[];
  accidents: Accident[];
  selectedPlace: Place | null;
  selectedAccident: Accident | null;
  isDetailModalOpen: boolean;
  isLoading: boolean;
  currentSearchQuery: string;
  currentCategories: string[];
  isSearchFocused: boolean;
  mapCenter: { lat: number; lng: number };
  showSearchButton: boolean;
}

export function useMapData() {
  const [state, setState] = useState<MapDataState>({
    places: [],
    accidents: [],
    selectedPlace: null,
    selectedAccident: null,
    isDetailModalOpen: false,
    isLoading: true,
    currentSearchQuery: "",
    currentCategories: [...PLACE_CATEGORY_IDS],
    isSearchFocused: false,
    mapCenter: { ...DEFAULT_MAP_CENTER },
    showSearchButton: false,
  });

  const loadData = useCallback(
    async (
      categories: string[],
      center: { lat: number; lng: number },
      searchQuery?: string
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const placeCategoriesToFetch = categories
        .filter((cat): cat is (typeof PLACE_CATEGORY_IDS)[number] =>
          (PLACE_CATEGORY_IDS as readonly string[]).includes(cat)
        )
        .map(
          (cat) =>
            LOCATION_TYPES[cat.toUpperCase() as keyof typeof LOCATION_TYPES]
        );

      const shouldFetchAccidents = categories.includes(ACCIDENT_CATEGORY_ID);

      const placesPromise =
        placeCategoriesToFetch.length > 0
          ? getPlaces(placeCategoriesToFetch, searchQuery)
          : Promise.resolve({ success: true, data: [] as Place[] });

      const accidentsPromise = shouldFetchAccidents
        ? getAccidents(
            String(center.lat),
            String(center.lng),
            DEFAULT_ACCIDENT_RADIUS
          )
        : Promise.resolve({ success: true, data: [] as Accident[] });

      const [placesResult, accidentsResult] = await Promise.all([
        placesPromise,
        accidentsPromise,
      ]);

      setState((prev) => ({
        ...prev,
        places: placesResult.success ? placesResult.data : prev.places,
        accidents: accidentsResult.success
          ? accidentsResult.data
          : prev.accidents,
        isLoading: false,
        showSearchButton: false,
      }));
    },
    []
  );

  // Initial data load
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      void loadData([...PLACE_CATEGORY_IDS], { ...DEFAULT_MAP_CENTER });
    });
    return () => cancelAnimationFrame(frameId);
  }, [loadData]);

  const handleSearch = useCallback(
    (query: string) => {
      setState((prev) => ({
        ...prev,
        currentSearchQuery: query,
        selectedPlace: null,
        currentCategories: [],
      }));
      loadData([], state.mapCenter, query);
    },
    [loadData, state.mapCenter]
  );

  const handleCategorySelect = useCallback(
    (categories: string[]) => {
      setState((prev) => ({
        ...prev,
        currentCategories: categories,
        selectedPlace: null,
        selectedAccident: null,
        currentSearchQuery: "",
      }));
      loadData(categories, state.mapCenter);
    },
    [loadData, state.mapCenter]
  );

  const handleMapMove = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      setState((prev) => ({
        ...prev,
        mapCenter: newCenter,
        showSearchButton: true,
      }));
    },
    []
  );

  const handleSearchInArea = useCallback(() => {
    loadData(state.currentCategories, state.mapCenter);
  }, [loadData, state.currentCategories, state.mapCenter]);

  const setSelectedPlace = useCallback((place: Place | null) => {
    setState((prev) => ({ ...prev, selectedPlace: place }));
  }, []);

  const setSelectedAccident = useCallback((accident: Accident | null) => {
    setState((prev) => ({ ...prev, selectedAccident: accident }));
  }, []);

  const handleSelectAccident = useCallback((accident: Accident | null) => {
    setState((prev) => ({
      ...prev,
      selectedAccident: accident,
      isDetailModalOpen: true,
    }));
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDetailModalOpen: false,
      selectedAccident: null,
    }));
  }, []);

  const setIsSearchFocused = useCallback((focused: boolean) => {
    setState((prev) => ({ ...prev, isSearchFocused: focused }));
  }, []);

  // Sorted places memoized to avoid re-sorting every render
  const sortedPlaces = useMemo(
    () =>
      [...state.places].sort((a, b) => {
        if (a.rating && b.rating) {
          return b.rating - a.rating;
        }
        return a.name.localeCompare(b.name);
      }),
    [state.places]
  );

  return {
    // Data
    places: state.places,
    accidents: state.accidents,
    sortedPlaces,

    // Selection state
    selectedPlace: state.selectedPlace,
    setSelectedPlace,
    selectedAccident: state.selectedAccident,
    setSelectedAccident,
    isDetailModalOpen: state.isDetailModalOpen,
    handleSelectAccident,
    handleCloseDetailModal,

    // UI state
    isLoading: state.isLoading,
    showSearchButton: state.showSearchButton,
    isSearchFocused: state.isSearchFocused,
    setIsSearchFocused,
    currentCategories: state.currentCategories,

    // Map
    mapCenter: state.mapCenter,
    handleMapMove,

    // Actions
    handleSearch,
    handleCategorySelect,
    handleSearchInArea,
  };
}
