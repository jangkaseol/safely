"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MapPin,
  Star,
  Calendar,
  Users,
  ChevronLeft,
  Plus,
  FileText,
  AlertTriangle,
  Phone,
  BookOpen,
  ChevronDown,
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
import type { Place, AiResponse, HalluCitedChunk } from "@/lib/types";
import AIChatSheet from "@/components/ai-chat-sheet";
import dynamic from "next/dynamic";

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

export default function PlaceDetailBottomSheet({
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
    "details" | "cases" | "none"
  >("none");
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const minHeight = 80;
  const midHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.4 : 300;
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight - 164 : 600;

  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    if (isSearchFocused) {
      setHeight(minHeight);
    }
  }, [isSearchFocused, minHeight]);

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
      const currentY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - startY.current;
      let newHeight = initialSheetHeight.current - deltaY;
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setHeight(newHeight);
    },
    [isDragging, minHeight, maxHeight]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
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
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const isContentVisible = height > minHeight;

  const handleClose = useCallback(() => {
    setHeight(minHeight);
    onBackToList();
  }, [onBackToList, minHeight]);

  const { generation, citedChunks } = parseAiRecommendations(
    selectedPlace?.ai_recommendations
  );

  const placeInfo = selectedPlace
    ? {
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
      }
    : null;

  const analysisSections =
    placeInfo?.aiAnalysisContent
      .split("---")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  const [
    greeting,
    coreRules,
    detailedGuide,
    emergencyContacts,
    similarCases,
    closing,
  ] = analysisSections;

  const renderSection = (content: string | undefined) => {
    if (!content) return null;
    return (
      <MarkdownRenderer
        content={content}
        citedChunks={citedChunks || undefined}
        showCitationList={false}
      />
    );
  };

  const handleRegisterNewPlace = () => {
    setIsRegisterSheetOpen(true);
  };

  const handleAskAI = () => {
    if (selectedPlace) {
      setIsAIChatOpen(true);
    }
  };

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
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {selectedPlace && placeInfo ? (
              <>
                <div className="flex items-center justify-between mb-4">
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

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">상세 정보</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2 col-span-full">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>기간: {placeInfo.period}</span>
                    </div>
                  </div>
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
                      {placeInfo.aiAnalysisTitle && (
                        <h4 className="text-xl font-bold mb-4 text-center">
                          {placeInfo.aiAnalysisTitle}
                        </h4>
                      )}

                      {analysisSections.length >= 6 ? (
                        <div className="space-y-4">
                          {/* 인사말 */}
                          <div className="p-4 bg-blue-50 rounded-lg">
                            {renderSection(greeting)}
                          </div>

                          {/* 핵심 안전수칙 */}
                          <div className="p-4 border rounded-lg">
                            {renderSection(coreRules)}
                          </div>

                          {/* 상세 안내 및 유사 사례 토글 버튼 */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() =>
                                setActiveToggle(
                                  activeToggle === "details"
                                    ? "none"
                                    : "details"
                                )
                              }
                              variant="outline"
                              className="w-full justify-between items-center h-12 bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold">상세 안내</span>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 transition-transform ${
                                  activeToggle === "details" ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                            <Button
                              onClick={() =>
                                setActiveToggle(
                                  activeToggle === "cases" ? "none" : "cases"
                                )
                              }
                              variant="outline"
                              className="w-full justify-between items-center h-12 bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="font-semibold">
                                  유사 사고 사례
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 transition-transform ${
                                  activeToggle === "cases" ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
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
                                <Phone className="w-5 h-5 text-green-600" />
                                <span>비상 연락망</span>
                              </AccordionTrigger>
                              <AccordionContent className="p-4 border rounded-lg mt-2">
                                {renderSection(emergencyContacts)}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* 감사 인사말 */}
                          <div className="p-4 bg-green-50 rounded-lg">
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
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">여행지 목록</h2>
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
                {places.length > 0 ? (
                  places.map((place) => (
                    <Card
                      key={place.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => onSelectPlace(place)}
                    >
                      <div className="relative">
                        <img
                          src={
                            place.image_url ||
                            "/placeholder.svg?height=150&width=250&text=Place Image"
                          }
                          alt={place.name}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">
                          {place.name}
                        </h3>
                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{place.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-700 mb-2">
                          {place.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>{place.rating}</span>
                            </div>
                          )}
                          {place.visitors && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span>{place.visitors}</span>
                            </div>
                          )}
                          {place.period_start && place.period_end && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-purple-500" />
                              <span>{`${place.period_start} ~ ${place.period_end}`}</span>
                            </div>
                          )}
                        </div>
                        {place.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {place.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {placeInfo && (
        <AIChatSheet
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          placeInfo={{
            name: selectedPlace?.name || "",
            address: selectedPlace?.address || "",
            description: selectedPlace?.description || "",
            ai_recommendations: selectedPlace?.ai_recommendations || null,
          }}
        />
      )}

      <RegisterFormSheet
        isOpen={isRegisterSheetOpen}
        onClose={() => setIsRegisterSheetOpen(false)}
      />
    </>
  );
}
