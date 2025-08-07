"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Accident } from "@/lib/types";

interface AccidentOverlayProps {
  accident: Accident;
  onClose: () => void;
}

export default function AccidentOverlay({
  accident,
  onClose,
}: AccidentOverlayProps) {
  return (
    <div className="absolute top-28 right-4 z-10 w-80">
      <Card>
        <CardHeader>
          <CardTitle>{accident.accident_type}</CardTitle>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </CardHeader>
        <CardContent>
          <p>
            <strong>날짜:</strong> {accident.accident_date}
          </p>
          <p>
            <strong>사상자:</strong> {accident.casualties}명
          </p>
          <p>
            <strong>개요:</strong> {accident.accident_overview}
          </p>
          {accident.accident_photo_url && (
            <div className="relative mt-2 h-48 w-full">
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
      </Card>
    </div>
  );
}
