"use client";

import { useState } from "react";

import Script from "next/script";
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
  const [isMapReady, setIsMapReady] = useState(false);

  const handleScriptLoad = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsMapReady(true);
      });
    }
  };

  const handleComplete = (data: Address) => {
    if (!window.kakao?.maps?.services) {
      toast.error("지도 서비스를 불러오는 데 실패했습니다. 다시 시도해주세요.");
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(data.address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result) {
        onComplete({
          address: result[0].address_name,
          latitude: Number(result[0].y),
          longitude: Number(result[0].x),
        });
        setIsOpen(false);
      } else {
        toast.error("주소 변환에 실패했습니다. 다시 시도해주세요.");
      }
    });
  };

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="ml-2"
            disabled={!isMapReady}
          >
            {isMapReady ? "주소 검색" : "준비 중..."}
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
    </>
  );
}
