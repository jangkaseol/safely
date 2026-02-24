"use client";

import { useState, useCallback, memo, useMemo, lazy, Suspense } from "react";
import {
  MapPin,
  Star,
  Users,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { Place } from "@/app/actions/places";
import dynamic from "next/dynamic";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { parseAiRecommendations } from "@/lib/ai-utils";

// Lazy load heavy components
const LazyAIChatSheet = lazy(() => import("@/components/ai-chat-sheet"));

const RegisterFormSheet = dynamic(() => import("./register-form-sheet"), {
  ssr: false,
});
import MarkdownRenderer from "@/components/ui/markdown-renderer";

interface PlaceDetailBottomSheetProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onBackToList: () => void;
  isSearchFocused: boolean;
}

// Memoized place card component
const MemoizedPlaceCard = memo(function PlaceCard({
  place,
  onSelectPlace
}: {
  place: Place;
  onSelectPlace: (place: Place) => void;
}) {
  const handleClick = useCallback(() => {
    onSelectPlace(place);
  }, [place, onSelectPlace]);

  return (
    <Card
      key={place.id}
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={
            place.image_url ||
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&crop=center"
          }
          alt={place.name}
          className="w-full h-40 object-cover"
        />
        {place.category && (
          <div className="absolute top-2 left-2">
            <div className="bg-foreground/50 text-primary-foreground px-2 py-1 rounded-md text-xs">
              {place.category === "tourist_spot" ? "관광지" : place.category === "festival" ? "축제" : place.category}
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{place.name}</h3>
          <p className="text-muted-foreground text-sm flex items-center">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{place.address}</span>
          </p>
          {place.description && (
            <p className="text-foreground text-sm line-clamp-2">{place.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Star className="w-3 h-3 mr-1" />
              <span>{place.rating || "N/A"}</span>
            </div>
            {place.visitors && (
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span>{place.visitors}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Main component with React.memo
const PlaceDetailBottomSheet = memo(function PlaceDetailBottomSheet({
  places,
  selectedPlace,
  onSelectPlace,
  onBackToList,
  isSearchFocused,
}: PlaceDetailBottomSheetProps) {
  const { sheetRef, height, isDragging, isContentVisible, handleDragStart } =
    useBottomSheetDrag();

  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isRegisterSheetOpen, setIsRegisterSheetOpen] = useState(false);

  // Memoize parsed AI recommendations to prevent expensive re-parsing
  const { generation, citedChunks } = useMemo(() => {
    return parseAiRecommendations(selectedPlace?.ai_recommendations);
  }, [selectedPlace?.ai_recommendations]);

  // Memoize place info to prevent recreation on every render
  const placeInfo = useMemo(() => {
    if (!selectedPlace) return null;

    return {
      name: selectedPlace.name,
      address: selectedPlace.address,
      imageUrl: selectedPlace.image_url || "",
      rating: selectedPlace.rating?.toString() || "N/A",
      period:
        selectedPlace.period_start && selectedPlace.period_end
          ? `${selectedPlace.period_start} ~ ${selectedPlace.period_end}`
          : "N/A",
      visitors: selectedPlace.visitors?.toString() || "N/A",
      aiAnalysisTitle: generation
        ? ""
        : selectedPlace.ai_analysis_title || "안전 분석 정보 없음",
      aiAnalysisContent:
        generation ||
        selectedPlace.ai_analysis_content ||
        "해당 장소에 대한 안전 분석 정보가 아직 준비되지 않았습니다.",
      description: selectedPlace.description,
    };
  }, [selectedPlace, generation]);


  const handleAskAI = useCallback(() => {
    if (placeInfo) {
      setIsAIChatOpen(true);
    }
  }, [placeInfo]);

  const handleRegisterNewPlace = useCallback(() => {
    setIsRegisterSheetOpen(true);
  }, []);

  // Memoize place cards to prevent recreation
  const placeCards = useMemo(() => {
    return places.map((place) => (
      <MemoizedPlaceCard
        key={place.id}
        place={place}
        onSelectPlace={onSelectPlace}
      />
    ));
  }, [places, onSelectPlace]);

  return (
    <>
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 bg-card rounded-t-2xl shadow-lg flex flex-col z-30",
          "transition-transform duration-300 ease-out",
          isDragging && "transition-none"
        )}
        style={{ height: `${height}px` }}
      >
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        {isContentVisible && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {placeInfo ? (
              <>
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBackToList}
                    className="-ml-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <h2 className="text-2xl font-bold flex-1 text-center pr-8">
                    {placeInfo.name}
                  </h2>
                </div>

                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-sm">{placeInfo.address}</span>
                </div>

                <div className="w-full h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-6">
                  <img
                    src={
                      placeInfo.imageUrl ||
                      "/placeholder.svg?height=192&width=384&text=Place Image"
                    }
                    alt={placeInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <Accordion type="single" collapsible defaultValue="item-1">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="text-lg font-semibold py-3">
                      AI 안전 분석
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <MarkdownRenderer
                        content={placeInfo.aiAnalysisContent}
                        citedChunks={citedChunks || undefined}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button
                  onClick={handleAskAI}
                  className="w-full mt-6"
                  disabled={!generation}
                >
                  AI에게 질문하기
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegisterNewPlace}
                    className="flex items-center gap-1 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새로운 여행지 등록하기</span>
                  </Button>
                </div>
                <div className="grid gap-4">
                  {placeCards}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Memoized child components */}
      <Suspense fallback={null}>
        <LazyAIChatSheet
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          placeInfo={placeInfo || { name: "", address: "", description: "", ai_recommendations: null }}
        />
      </Suspense>

      <RegisterFormSheet
        isOpen={isRegisterSheetOpen}
        onClose={() => setIsRegisterSheetOpen(false)}
      />
    </>
  );
});

// Add display name for debugging
PlaceDetailBottomSheet.displayName = 'PlaceDetailBottomSheet';

export default PlaceDetailBottomSheet;
