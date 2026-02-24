"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import RegisterForm from "./register/RegisterForm";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RegisterFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterFormSheet({
  isOpen,
  onClose,
}: RegisterFormSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="w-full h-[95vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-2xl font-bold">
            새로운 여행지 등록
          </SheetTitle>
          <SheetDescription>
            새로운 관광지나 축제 정보를 공유하고, AI 분석을 통해 더 안전한
            여행을 만들어보세요.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-6">
            <RegisterForm />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
