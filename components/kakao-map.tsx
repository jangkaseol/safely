"use client";

import { useEffect, useState } from "react";
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
  onMapMove?: (center: { lat: number; lng: number }) => void;
  center?: { lat: number; lng: number };
}

const getMarkerSvg = (category: string | null, isAccident: boolean = false) => {
  let icon = "";
  let color = "";

  if (isAccident) {
    color = "#3b82f6"; // blue-500
    icon = `<path fill="${color}" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>`;
  } else if (category === LOCATION_TYPES.TOURIST_SPOT) {
    color = "#ef4444"; // red-500
    icon = `<path fill="${color}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;
  } else {
    // LOCATION_TYPES.FESTIVAL 또는 기타
    color = "#f59e0b"; // amber-500
    icon = `<path fill="${color}" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${MARKER_SIZE}" height="${MARKER_SIZE}">
      <g transform="translate(0, 0)">
        ${icon}
      </g>
    </svg>
  `;
};

export default function KakaoMap({
  places = [],
  accidents = [],
  selectedPlace,
  onSelectPlace,
  onMapMove,
  center = { lat: 36.5, lng: 127.5 },
}: KakaoMapProps) {
  const [map, setMap] = useState<kakao.maps.Map>();

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

  return (
    <Map
      center={center}
      style={{ width: "100%", height: "100%" }}
      level={8}
      onCreate={setMap}
      onClick={() => onSelectPlace && onSelectPlace(null)}
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
        const markerSvg = getMarkerSvg(place.category);
        return (
          <MapMarker
            key={`place-${place.id}`}
            position={{ lat: place.latitude, lng: place.longitude }}
            image={{
              src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                markerSvg
              )}`,
              size: { width: MARKER_SIZE, height: MARKER_SIZE },
              options: { offset: { x: MARKER_SIZE / 2, y: MARKER_SIZE / 2 } },
            }}
            title={place.name}
            onClick={() => onSelectPlace && onSelectPlace(place)}
          />
        );
      })}

      {/* 사고 마커 */}
      {accidents.map((accident) => {
        if (!accident.lat || !accident.lon) return null;
        const markerSvg = getMarkerSvg(null, true);
        return (
          <MapMarker
            key={`accident-${accident.id}`}
            position={{ lat: accident.lat, lng: accident.lon }}
            image={{
              src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                markerSvg
              )}`,
              size: { width: MARKER_SIZE, height: MARKER_SIZE },
              options: { offset: { x: MARKER_SIZE / 2, y: MARKER_SIZE / 2 } },
            }}
            title={accident.accident_type || "사고"}
            // 사고 마커 클릭 시 이벤트 핸들러 (필요시 구현)
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
