"use client";

import { useState, useEffect } from "react";
import DaumPostcode, { type Address } from "react-daum-postcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddressSearchProps {
  onComplete: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function AddressSearch({ onComplete }: AddressSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isKakaoReady, setIsKakaoReady] = useState(false);

  // 카카오 맵 초기화 상태 확인
  // 주의: KakaoMap 컴포넌트가 먼저 window.kakao.maps.load()를 호출해야 services 사용 가능
  // react-kakao-maps-sdk와 순수 SDK를 함께 사용할 때는 초기화 순서가 중요함
  useEffect(() => {
    const checkKakaoReady = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        // console.log("✅ AddressSearch: 카카오 맵 서비스 준비 완료");
        setIsKakaoReady(true);
        return true;
      }
      return false;
    };

    if (checkKakaoReady()) {
      return;
    }

    // 주기적 체크 - KakaoMap의 초기화를 기다림
    const interval = setInterval(() => {
      if (checkKakaoReady()) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleComplete = (data: Address) => {
    // console.log("🔍 주소 검색 완료:", data);

    // react-kakao-maps-sdk가 이미 로드한 카카오 맵 API 사용
    if (!window.kakao?.maps?.services) {
      toast.error(
        "지도 서비스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      // console.log("🗺️ Geocoder 생성 완료");

      geocoder.addressSearch(data.address, (result, status) => {
        // console.log("📍 Geocoder 결과:", {
        //   result,
        //   status,
        //   statusOK: window.kakao.maps.services.Status.OK,
        // });

        if (
          status === window.kakao.maps.services.Status.OK &&
          result &&
          result.length > 0
        ) {
          // console.log("✅ 좌표 변환 성공:", result[0]);

          const addressResult = {
            address: result[0].address_name,
            latitude: Number(result[0].y),
            longitude: Number(result[0].x),
          };

          // console.log("📤 최종 결과 전달:", addressResult);
          onComplete(addressResult);
          setIsOpen(false);
          toast.success("주소가 성공적으로 설정되었습니다.");
        } else {
          // console.error("❌ 주소 변환 실패:", { status, result });
          toast.error(
            "주소 변환에 실패했습니다. 다른 주소로 다시 시도해주세요."
          );
        }
      });
    } catch (error) {
      // console.error("❌ Geocoder 생성 또는 실행 중 오류:", error);
      toast.error("주소 검색 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 디버깅: 현재 상태 로그 (필요 시 주석 해제)
  // console.log("🔍 AddressSearch 현재 상태:", {
  //   kakao: !!window.kakao,
  //   maps: !!window.kakao?.maps,
  //   services: !!window.kakao?.maps?.services,
  //   isKakaoReady,
  // });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="ml-2"
          disabled={!isKakaoReady}
        >
          {isKakaoReady ? "주소 검색" : "지도 준비 중..."}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>주소 검색</DialogTitle>
          <DialogDescription>
            도로명, 건물명 또는 지번으로 검색해주세요.
          </DialogDescription>
        </DialogHeader>
        <DaumPostcode onComplete={handleComplete} style={{ height: 480 }} />
      </DialogContent>
    </Dialog>
  );
}
