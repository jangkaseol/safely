"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, memo, useMemo, lazy, Suspense } from "react";
import {
  MapPin,
  Star,
  Calendar,
  Users,
  ChevronLeft,
  Plus,
  FileText,
  AlertTriangle,
  CloudRain,
  Phone,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { Place, AiResponse, HalluCitedChunk } from "@/lib/types";
import dynamic from "next/dynamic";

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

// DB에서 받은 ai_recommendations 값을 파싱하여 화면에 표시할 최종 답변과 출처를 추출하는 함수
function parseAiRecommendations(
  recommendations: AiResponse | null | undefined
): {
  generation: string | null;
  citedChunks: HalluCitedChunk[] | null;
} {
  // 추천 정보가 없으면 null 반환
  if (!recommendations) {
    return { generation: null, citedChunks: null };
  }

  // 최종 답변과 출처(citations)를 추출하여 반환
  const generation = recommendations.generation || null;
  const citedChunks = recommendations.hallu_check?.cited_chunks || null;

  return { generation, citedChunks };
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
            <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-xs">
              {place.category === "tourist_spot" ? "관광지" : place.category === "festival" ? "축제" : place.category}
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{place.name}</h3>
          <p className="text-gray-600 text-sm flex items-center">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{place.address}</span>
          </p>
          {place.description && (
            <p className="text-gray-700 text-sm line-clamp-2">{place.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const initialSheetHeight = useRef(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isRegisterSheetOpen, setIsRegisterSheetOpen] = useState(false);
  const [activeToggle, setActiveToggle] = useState<
    "details" | "cases" | "weather" | "none"
  >("none");
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  // Throttling for drag operations
  const dragAnimationFrameRef = useRef<number>();
  const lastDragTime = useRef(0);

  const minHeight = 80;
  const midHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.4 : 300;
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight - 164 : 600;

  const [height, setHeight] = useState(minHeight);

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

  // Memoize analysis sections to prevent re-splitting
  const analysisSections = useMemo(() => {
    return placeInfo?.aiAnalysisContent
      .split("---")
      .map((s) => s.trim())
      .filter(Boolean) || [];
  }, [placeInfo?.aiAnalysisContent]);

  // Memoized event handlers
  const handleToggleChange = useCallback((value: string) => {
    setActiveToggle(value as "details" | "cases" | "weather" | "none" || "none");
  }, []);

  const handleAskAI = useCallback(() => {
    if (placeInfo) {
      setIsAIChatOpen(true);
    }
  }, [placeInfo]);

  const handleRegisterNewPlace = useCallback(() => {
    setIsRegisterSheetOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setHeight(minHeight);
    onBackToList();
  }, [onBackToList, minHeight]);

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

  const handleStart = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      if (!sheetRef.current) return;
      setIsDragging(true);
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      initialSheetHeight.current = sheetRef.current.clientHeight;
      sheetRef.current.style.transition = "none";
    },
    []
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      // Throttle drag updates using requestAnimationFrame
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
      }

      dragAnimationFrameRef.current = requestAnimationFrame(() => {
        const currentTime = performance.now();
        // Limit updates to ~60fps (16.67ms intervals)
        if (currentTime - lastDragTime.current < 16) return;

        const currentY = "touches" in e ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY.current;
        let newHeight = initialSheetHeight.current - deltaY;
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        setHeight(newHeight);

        lastDragTime.current = currentTime;
      });
    },
    [isDragging, minHeight, maxHeight]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;

    // Cancel any pending animation frame
    if (dragAnimationFrameRef.current) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
    }

    setIsDragging(false);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.3s ease-out";
      const currentHeight = sheetRef.current.clientHeight;
      let snapHeight = minHeight;
      if (currentHeight < (minHeight + midHeight) / 2) {
        snapHeight = minHeight;
      } else if (currentHeight < (midHeight + maxHeight) / 2) {
        snapHeight = midHeight;
      } else {
        snapHeight = maxHeight;
      }
      setHeight(snapHeight);
    }
  }, [isDragging, minHeight, midHeight, maxHeight]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: true });
      document.addEventListener("touchend", handleEnd);
    } else {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    }

    return () => {
      // Clean up animation frame on unmount
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
      }
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const isContentVisible = height > minHeight;

  return (
    <>
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-lg flex flex-col z-30",
          "transition-transform duration-300 ease-out",
          isDragging && "transition-none"
        )}
        style={{ height: `${height}px` }}
      >
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
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

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-sm">{placeInfo.address}</span>
                </div>

                <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-6">
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
                      {analysisSections.length >= 7 ? (
                        <div className="space-y-4">
                          {/* 인사말 */}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            {renderSection(greeting)}
                          </div>

                          {/* 핵심 안전수칙 */}
                          <div className="p-4 border rounded-lg">
                            {renderSection(coreRules)}
                          </div>

                          {/* 상세 안내, 유사 사고 사례, 날씨 관련 주의사항 - 세그먼트 토글 (긴 텍스트 대응) */}
                          <div className="w-full overflow-x-auto">
                            <ToggleGroup
                              type="single"
                              variant="outline"
                              className="w-full"
                              value={activeToggle === "none" ? "" : activeToggle}
                              onValueChange={handleToggleChange}
                            >
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                      value="details"
                                      className="h-12 gap-2"
                                    >
                                      <FileText className="w-5 h-5 text-gray-700" />
                                      <span className="font-semibold truncate min-w-0">
                                        상세 안내
                                      </span>
                                    </ToggleGroupItem>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    상세 안내
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                      value="cases"
                                      className="h-12 gap-2"
                                    >
                                      <AlertTriangle className="w-5 h-5 text-gray-700" />
                                      <span className="font-semibold truncate min-w-0">
                                        <span className="hidden sm:inline">
                                          유사 행사 사고 사례
                                        </span>
                                        <span className="sm:hidden">
                                          유사 사고
                                        </span>
                                      </span>
                                    </ToggleGroupItem>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    유사 행사 사고 사례
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                      value="weather"
                                      className="h-12 gap-2"
                                    >
                                      <CloudRain className="w-5 h-5 text-gray-700" />
                                      <span className="font-semibold truncate min-w-0">
                                        <span className="hidden sm:inline">
                                          날씨 관련 주의사항
                                        </span>
                                        <span className="sm:hidden">
                                          날씨 주의
                                        </span>
                                      </span>
                                    </ToggleGroupItem>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    날씨 관련 주의사항
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </ToggleGroup>
                          </div>

                          {/* 상세 안내 내용 */}
                          {activeToggle === "details" && (
                            <div className="p-4 border rounded-lg animate-in fade-in-50 slide-in-from-top-2 duration-300">
                              {renderSection(detailedGuide)}
                            </div>
                          )}

                          {/* 유사 사례 내용 */}
                          {activeToggle === "cases" && (
                            <div className="p-4 border rounded-lg animate-in fade-in-50 slide-in-from-top-2 duration-300">
                              {renderSection(similarCases)}
                            </div>
                          )}

                          {/* 날씨 관련 주의사항 내용 */}
                          {activeToggle === "weather" && (
                            <div className="p-4 border rounded-lg animate-in fade-in-50 slide-in-from-top-2 duration-300">
                              {renderSection(weatherCaution)}
                            </div>
                          )}

                          {/* 비상 연락망 토글 아래로 이동 */}
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            onValueChange={(value) =>
                              setShowEmergencyContacts(!!value)
                            }
                          >
                            <AccordionItem value="emergency">
                              <AccordionTrigger className="font-semibold text-base flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                <Phone className="w-5 h-5 text-gray-700" />
                                <span>비상 연락망</span>
                              </AccordionTrigger>
                              <AccordionContent className="p-4 border rounded-lg mt-2">
                                {renderSection(emergencyContacts)}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* 감사 인사말 */}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            {renderSection(closing)}
                          </div>

                          {/* 참고자료 보기 버튼 */}
                          <div className="text-center pt-4">
                            <Button
                              onClick={() => setShowCitations(!showCitations)}
                              variant="link"
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              {showCitations
                                ? "참고자료 숨기기"
                                : "참고자료 보기"}
                            </Button>
                          </div>

                          {/* 참고자료 내용 */}
                          {showCitations && (
                            <div className="mt-2 p-4 border rounded-lg bg-gray-50 animate-in fade-in-50">
                              <MarkdownRenderer
                                content=""
                                citedChunks={citedChunks || undefined}
                                showCitationList={true}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <MarkdownRenderer
                          content={placeInfo.aiAnalysisContent}
                          citedChunks={citedChunks || undefined}
                        />
                      )}
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