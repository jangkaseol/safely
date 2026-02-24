"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Accident } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

interface AccidentDetailModalProps {
  accident: Accident | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccidentDetailModal({
  accident,
  isOpen,
  onClose,
}: AccidentDetailModalProps) {
  if (!accident) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{accident.accident_type}</DialogTitle>
          <DialogDescription>
            {formatDate(accident.accident_date)} | 사상자: {accident.casualties}
            명
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden py-4">
          <div className="relative w-full md:w-1/2 h-64 md:h-full">
            {accident.accident_photo_url ? (
              <Image
                src={accident.accident_photo_url}
                alt={accident.accident_type ?? "사고 이미지"}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-md"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted rounded-md">
                <p className="text-muted-foreground">이미지가 없습니다.</p>
              </div>
            )}
          </div>
          <ScrollArea className="w-full md:w-1/2 h-full">
            <div className="pr-4">
              <h3 className="font-bold text-lg mb-2">사고 개요</h3>
              <p className="text-base whitespace-pre-wrap leading-relaxed">
                {accident.accident_overview}
              </p>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
