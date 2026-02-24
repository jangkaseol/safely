"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Accident } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "./ui/button";

interface AccidentOverlayProps {
  accident: Accident;
  onClose: () => void;
  onMoreInfo: () => void;
}

export default function AccidentOverlay({
  accident,
  onClose,
  onMoreInfo,
}: AccidentOverlayProps) {
  return (
    <div className="absolute top-28 right-4 z-10 w-80">
      <Card>
        <CardHeader>
          <CardTitle>{accident.accident_type}</CardTitle>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        </CardHeader>
        <CardContent>
          <p>
            <strong>날짜:</strong> {formatDate(accident.accident_date)}
          </p>
          <p>
            <strong>사상자:</strong> {accident.casualties}명
          </p>
          {accident.accident_photo_url && (
            <div className="relative mt-2 h-40 w-full">
              <Image
                src={accident.accident_photo_url}
                alt={accident.accident_type ?? "사고 이미지"}
                fill
                style={{ objectFit: "cover" }}
                className="rounded"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onMoreInfo} size="sm">
            자세히 보기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
