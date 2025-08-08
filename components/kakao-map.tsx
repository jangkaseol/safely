"use client";

import { useEffect, useState, useRef } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { LOCATION_TYPES, MARKER_SIZE } from "@/lib/constants";
import type { Place, Accident } from "@/lib/types";

export interface PolygonData {
  path: { lat: number; lng: number }[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
}

interface KakaoMapProps {
  places?: Place[];
  accidents?: Accident[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place | null) => void;
  onSelectAccident?: (accident: Accident | null) => void;
  onMapMove?: (center: { lat: number; lng: number }) => void;
  center?: { lat: number; lng: number };
}

const getMarkerImageInfo = (
  category: string | null,
  isAccident: boolean = false,
  accidentType?: string | null
): { src: string } => {
  if (isAccident) {
    if (accidentType === "화재(폭발 포함) 사고") {
      return { src: "/fire.svg" };
    } else {
      return { src: "/warning.svg" };
    }
  }

  if (category === LOCATION_TYPES.TOURIST_SPOT) {
    return { src: "/london-eye.svg" };
  }

  if (category === LOCATION_TYPES.FESTIVAL) {
    return { src: "/firecracker.png" };
  }

  // 기본 마커 (별 모양)
  const color = "#f97316"; // orange-500
  const icon = `<path fill="${color}" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`;

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${MARKER_SIZE}" height="${MARKER_SIZE}">
      <g transform="translate(0, 0)">
        ${icon}
      </g>
    </svg>
  `;

  return {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
  };
};

export default function KakaoMap({
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

  // 카카오 맵 초기화
  // 주의: react-kakao-maps-sdk 사용 시 수동 초기화 필요
  // autoload=false로 설정된 스크립트를 window.kakao.maps.load()로 활성화
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        // console.log("✅ KakaoMap: 카카오 맵 초기화 완료");
        setIsKakaoLoaded(true);
      });
    }
  }, []);

  useEffect(() => {
    if (map && center) {
      const newCenter = new kakao.maps.LatLng(center.lat, center.lng);
      map.setCenter(newCenter);
    }
  }, [map, center]);

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
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <div className="text-gray-500">지도 로딩 중...</div>
      </div>
    );
  }

  return (
    <Map
      center={center}
      style={{ width: "100%", height: "100%" }}
      level={8}
      onCreate={setMap}
      onClick={() => {
        if (markerClickedRef.current) {
          markerClickedRef.current = false;
          return;
        }
        onSelectPlace?.(null);
        onSelectAccident?.(null);
      }}
      onDragEnd={(map) =>
        onMapMove?.({
          lat: map.getCenter().getLat(),
          lng: map.getCenter().getLng(),
        })
      }
      onZoomChanged={(map) =>
        onMapMove?.({
          lat: map.getCenter().getLat(),
          lng: map.getCenter().getLng(),
        })
      }
    >
      {/* 장소 마커 */}
      {places.map((place) => {
        if (!place.latitude || !place.longitude) return null;
        const imageInfo = getMarkerImageInfo(place.category, false);
        return (
          <MapMarker
            key={`place-${place.id}`}
            position={{ lat: place.latitude, lng: place.longitude }}
            image={{
              src: imageInfo.src,
              size: { width: MARKER_SIZE, height: MARKER_SIZE },
              options: { offset: { x: MARKER_SIZE / 2, y: MARKER_SIZE / 2 } },
            }}
            title={place.name}
            onClick={() => {
              markerClickedRef.current = true;
              onSelectPlace?.(place);
            }}
          />
        );
      })}

      {/* 사고 마커 */}
      {accidents.map((accident) => {
        if (!accident.lat || !accident.lon) return null;
        const imageInfo = getMarkerImageInfo(
          null,
          true,
          accident.accident_type
        );
        return (
          <MapMarker
            key={`accident-${accident.id}`}
            position={{ lat: accident.lat, lng: accident.lon }}
            image={{
              src: imageInfo.src,
              size: { width: MARKER_SIZE, height: MARKER_SIZE },
              options: { offset: { x: MARKER_SIZE / 2, y: MARKER_SIZE / 2 } },
            }}
            title={accident.accident_type || "사고"}
            onClick={() => {
              markerClickedRef.current = true;
              onSelectAccident?.(accident);
            }}
          />
        );
      })}

      {selectedPlace &&
        onSelectPlace &&
        selectedPlace.latitude &&
        selectedPlace.longitude && (
          <CustomOverlayMap
            position={{
              lat: selectedPlace.latitude,
              lng: selectedPlace.longitude,
            }}
            yAnchor={1.5}
          >
            <div className="min-w-[150px] rounded-lg bg-white p-3 text-center shadow-lg">
              <h4 className="text-sm font-bold">{selectedPlace.name}</h4>
              <p className="text-xs text-gray-600">
                {selectedPlace.category || "장소"}
              </p>
            </div>
          </CustomOverlayMap>
        )}
    </Map>
  );
}
