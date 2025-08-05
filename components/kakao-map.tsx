"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { LOCATION_TYPES, MARKER_SIZE } from "@/lib/constants";
import type { Place } from "@/lib/types";

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
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place | null) => void;
}

const getMarkerSvg = (category: string | null) => {
  let icon = "";
  let color = "";

  if (category === LOCATION_TYPES.TOURIST_SPOT) {
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
  selectedPlace,
  onSelectPlace,
}: KakaoMapProps) {
  const [map, setMap] = useState<kakao.maps.Map>();

  useEffect(() => {
    if (map) {
      map.relayout();
    }
  }, [map]);

  useEffect(() => {
    if (
      map &&
      selectedPlace &&
      selectedPlace.latitude &&
      selectedPlace.longitude &&
      onSelectPlace
    ) {
      const newCenter = new kakao.maps.LatLng(
        selectedPlace.latitude,
        selectedPlace.longitude
      );
      map.panTo(newCenter);
      map.setLevel(8);
    }
  }, [map, selectedPlace, onSelectPlace]);

  return (
    <Map
      center={{ lat: 36.5, lng: 127.5 }}
      style={{ width: "100%", height: "100%" }}
      level={12}
      onCreate={setMap}
      onClick={() => onSelectPlace && onSelectPlace(null)}>
      {places.map((place) => {
        if (!place.latitude || !place.longitude) return null;

        const markerSvg = getMarkerSvg(place.category);

        return (
          <MapMarker
            key={`marker-${place.id}`}
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

      {selectedPlace &&
        onSelectPlace &&
        selectedPlace.latitude &&
        selectedPlace.longitude && (
          <CustomOverlayMap
            position={{
              lat: selectedPlace.latitude,
              lng: selectedPlace.longitude,
            }}
            yAnchor={1.5}>
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
