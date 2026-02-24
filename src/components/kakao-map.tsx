"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import { Map as KakaoMapComponent, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { LOCATION_TYPES, MARKER_SIZE } from "@/lib/constants";
import type { Place } from "@/app/actions/places";
import type { Accident } from "@/lib/types";

// Accident marker color constant (orange-500) — kept as hex for SVG generation
const ACCIDENT_MARKER_COLOR = "#f97316";

interface KakaoMapProps {
  places?: Place[];
  accidents?: Accident[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place | null) => void;
  onSelectAccident?: (accident: Accident | null) => void;
  onMapMove?: (center: { lat: number; lng: number }) => void;
  center?: { lat: number; lng: number };
}

// Cache for generated marker images to avoid expensive SVG generation
const markerImageCache = new Map<string, string>();

const getMarkerImageInfo = (
  category: string | null,
  isAccident: boolean = false,
  accidentType?: string | null
): { src: string; size: { width: number; height: number } } => {
  // Create cache key
  const cacheKey = `${category}-${isAccident}-${accidentType || 'default'}`;
  
  // Check cache first
  if (markerImageCache.has(cacheKey)) {
    return { src: markerImageCache.get(cacheKey)!, size: { width: MARKER_SIZE, height: MARKER_SIZE } };
  }

  let src: string;

  if (isAccident) {
    if (accidentType === "화재(폭발 포함) 사고") {
      src = "/fire.svg";
    } else {
      src = "/warning.svg";
    }
  } else if (category === LOCATION_TYPES.TOURIST_SPOT) {
    src = "/london-eye.svg";
  } else if (category === LOCATION_TYPES.FESTIVAL) {
    src = "/firecracker.png";
  } else {
    // Only generate SVG for default markers and cache the result
    const color = ACCIDENT_MARKER_COLOR;
    const icon = `<path fill="${color}" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`;

    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${MARKER_SIZE}" height="${MARKER_SIZE}">
      <g transform="translate(0, 0)">
        ${icon}
      </g>
    </svg>
  `;

    src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
  }

  // Cache the result
  markerImageCache.set(cacheKey, src);
  return { src, size: { width: MARKER_SIZE, height: MARKER_SIZE } };
};

// Memoized marker component for better performance
const MemoizedMapMarker = memo(function MemoizedMapMarkerInner({
  position,
  image,
  onClick,
  title
}: {
  position: { lat: number; lng: number };
  image: { src: string; size: { width: number; height: number } };
  onClick: () => void;
  title: string;
}) {
  return (
    <MapMarker
      position={position}
      image={image}
      onClick={onClick}
      title={title}
    />
  );
});

// Memoized overlay component
const MemoizedCustomOverlay = memo(function MemoizedCustomOverlayInner({
  position,
  children,
  yAnchor
}: {
  position: { lat: number; lng: number };
  children: React.ReactNode;
  yAnchor: number;
}) {
  return (
    <CustomOverlayMap position={position} yAnchor={yAnchor}>
      {children}
    </CustomOverlayMap>
  );
});

const KakaoMap = memo(function KakaoMap({
  places = [],
  accidents = [],
  selectedPlace,
  onSelectPlace,
  onSelectAccident,
  onMapMove,
  center = { lat: 36.5, lng: 127.5 },
}: KakaoMapProps) {
  const [map, setMap] = useState<kakao.maps.Map>();
  const markerClickedRef = useRef(false);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

  // Memoize marker click handlers to prevent re-renders
  const handlePlaceClick = useCallback((place: Place) => {
    markerClickedRef.current = true;
    onSelectPlace?.(place);
  }, [onSelectPlace]);

  const handleAccidentClick = useCallback((accident: Accident) => {
    markerClickedRef.current = true;
    onSelectAccident?.(accident);
  }, [onSelectAccident]);

  // Memoize map click handler
  const handleMapClick = useCallback(() => {
    if (!markerClickedRef.current) {
      onSelectPlace?.(null);
      onSelectAccident?.(null);
    }
    markerClickedRef.current = false;
  }, [onSelectPlace, onSelectAccident]);

  // Memoize center change handler
  const handleCenterChange = useCallback((map: kakao.maps.Map) => {
    if (map && onMapMove) {
      const center = map.getCenter();
      onMapMove({
        lat: center.getLat(),
        lng: center.getLng(),
      });
    }
  }, [onMapMove]);

  // Memoize place markers to avoid recreation
  const placeMarkers = useMemo(() => {
    return places.map((place) => {
      if (!place.latitude || !place.longitude) return null;
      const imageInfo = getMarkerImageInfo(place.category, false);
      
      return (
        <MemoizedMapMarker
          key={`place-${place.id}`}
          position={{ lat: place.latitude, lng: place.longitude }}
          image={imageInfo}
          onClick={() => handlePlaceClick(place)}
          title={place.name}
        />
      );
    }).filter(Boolean);
  }, [places, handlePlaceClick]);

  // Memoize accident markers
  const accidentMarkers = useMemo(() => {
    return accidents.map((accident) => {
      if (!accident.lat || !accident.lon) return null;
      const imageInfo = getMarkerImageInfo(null, true, accident.accident_type);
      
      return (
        <MemoizedMapMarker
          key={`accident-${accident.id}`}
          position={{ lat: accident.lat, lng: accident.lon }}
          image={imageInfo}
          onClick={() => handleAccidentClick(accident)}
          title={accident.accident_overview || 'Accident'}
        />
      );
    }).filter(Boolean);
  }, [accidents, handleAccidentClick]);

  // Memoize selected place overlay
  const selectedPlaceOverlay = useMemo(() => {
    if (!selectedPlace || !selectedPlace.latitude || !selectedPlace.longitude) {
      return null;
    }

    return (
      <MemoizedCustomOverlay
        position={{
          lat: selectedPlace.latitude,
          lng: selectedPlace.longitude,
        }}
        yAnchor={1.5}
      >
        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium relative">
          {selectedPlace.name}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary"></div>
        </div>
      </MemoizedCustomOverlay>
    );
  }, [selectedPlace]);

  useEffect(() => {
    if (!kakaoAppKey) {
      return;
    }

    let cancelled = false;
    let retries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryLoad = () => {
      if (cancelled) return;

      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => {
          if (cancelled) return;
          setLoadError(null);
          setIsKakaoLoaded(true);
        });
        return;
      }

      const hasScript = document.querySelector(
        'script[data-kakao-maps="true"],script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
      );

      if (!hasScript) {
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&libraries=services&autoload=false`;
        script.async = true;
        script.setAttribute("data-kakao-maps", "true");
        script.addEventListener("error", () => {
          setLoadError("카카오 맵 스크립트를 불러오지 못했습니다.");
        });
        document.head.appendChild(script);
      }

      retries += 1;
      if (retries > 50) {
        setLoadError("카카오 맵 초기화가 지연되고 있습니다. 잠시 후 새로고침해주세요.");
        return;
      }

      timer = setTimeout(tryLoad, 100);
    };

    tryLoad();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [kakaoAppKey]);

  useEffect(() => {
    if (!map || !isKakaoLoaded) {
      return;
    }

    const relayout = () => {
      map.relayout();
      const newCenter = new kakao.maps.LatLng(center.lat, center.lng);
      map.setCenter(newCenter);
    };

    const frame = requestAnimationFrame(relayout);
    window.addEventListener("resize", relayout);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", relayout);
    };
  }, [map, isKakaoLoaded, center]);

  useEffect(() => {
    if (
      map &&
      selectedPlace &&
      selectedPlace.latitude &&
      selectedPlace.longitude
    ) {
      const newCenter = new kakao.maps.LatLng(
        selectedPlace.latitude,
        selectedPlace.longitude
      );
      map.panTo(newCenter);
    }
  }, [map, selectedPlace]);

  if (!isKakaoLoaded) {
    const loadingMessage = !kakaoAppKey
      ? "NEXT_PUBLIC_KAKAO_APP_KEY가 설정되지 않았습니다."
      : loadError ?? "지도를 불러오는 중...";

    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-muted-foreground">{loadingMessage}</div>
      </div>
    );
  }

  return (
    <div className="kakao-map-root w-full h-full">
      <KakaoMapComponent
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={8}
        onCreate={setMap}
        onClick={handleMapClick}
        onCenterChanged={handleCenterChange}
      >
        {placeMarkers}
        {accidentMarkers}
        {selectedPlaceOverlay}
      </KakaoMapComponent>
    </div>
  );
});

// Add display name for debugging
KakaoMap.displayName = 'KakaoMap';

export default KakaoMap;
