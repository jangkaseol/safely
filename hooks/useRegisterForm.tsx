"use client";

import { useState, useCallback, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { createLocation } from "@/app/actions/register";
import { uploadFile } from "@/lib/file-upload";
import type {
  Location,
  EmergencyContact,
  CreateLocationPayload,
  LocationFiles,
} from "@/lib/types";

// 데이터 파일의 상태를 관리하기 위한 인터페이스 (File 객체 포함)
interface DataFile
  extends Omit<LocationFiles, "id" | "location_id" | "created_at"> {
  id: number; // 프론트엔드 관리를 위한 임시 ID
  file: File;
  uploading?: boolean;
}

// 폼의 모든 상태를 관리
type FormState = Omit<
  Location,
  | "id"
  | "created_at"
  | "updated_at"
  | "emergency_contacts"
  | "start_date"
  | "end_date"
>;

export function useRegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [locationData, setLocationData] = useState<FormState>({
    name: "",
    location: "",
    latitude: null,
    longitude: null,
    region: "서울",
    type: "관광지",
    description: "",
    image_url: null,
    category: "",
    status: "운영중",
    start_time: null,
    end_time: null,
  });

  const [periodType, setPeriodType] = useState<"always" | "period">("always");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([{ id: 1, name: "", contact_number: "" }]);
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setLocationData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleAddressComplete = useCallback(
    (data: { address: string; latitude: number; longitude: number }) => {
      setLocationData((prev) => ({
        ...prev,
        location: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      }));
    },
    []
  );

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      }
    },
    []
  );

  const addEmergencyContact = useCallback(() => {
    setEmergencyContacts((prev) => [
      ...prev,
      { id: Date.now(), name: "", contact_number: "" },
    ]);
  }, []);

  const removeEmergencyContact = useCallback((id: number) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleEmergencyContactChange = useCallback(
    (id: number, field: "name" | "contact_number", value: string) => {
      setEmergencyContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleDataFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const MAX_FILE_SIZE_MB = 50;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

      const newFiles = Array.from(files)
        .filter((file) => {
          if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(
              `${file.name} 파일의 크기가 너무 큽니다. (${MAX_FILE_SIZE_MB}MB 이하만 가능)`
            );
            return false;
          }
          return true;
        })
        .map((file) => ({
          id: Date.now() + Math.random(),
          file_name: file.name,
          file_path: "", // 업로드 후 채워짐
          file_type: file.type,
          file_size: file.size,
          description: "",
          file,
          user_id: null,
          ocr_text: "",
        }));

      setDataFiles((prev) => [...prev, ...newFiles]);
    },
    []
  );

  const removeDataFile = useCallback((id: number) => {
    setDataFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateDataFileDescription = useCallback(
    (id: number, description: string) => {
      setDataFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, description } : f))
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    startTransition(async () => {
      try {
        toast.info("새로운 장소 등록을 시작합니다...");

        let finalImageUrl = locationData.image_url;
        if (imageFile) {
          toast.info("대표 이미지를 업로드 중입니다...");
          const uploadedImage = await uploadFile(imageFile);
          finalImageUrl = uploadedImage.url;
          toast.success("대표 이미지 업로드 완료!");
        } else if (!finalImageUrl) {
          finalImageUrl = `https://picsum.photos/seed/${uuidv4()}/600/400`;
        }

        toast.info("관련 데이터 파일을 업로드 중입니다...");
        const uploadedFiles: Omit<
          LocationFiles,
          "id" | "location_id" | "created_at" | "user_id"
        >[] = [];
        for (const dataFile of dataFiles) {
          const uploaded = await uploadFile(dataFile.file);
          uploadedFiles.push({
            file_name: uploaded.name,
            file_path: uploaded.path,
            file_type: uploaded.type,
            file_size: uploaded.size,
            description: dataFile.description,
            ocr_text: "",
          });
        }
        toast.success("관련 데이터 파일 업로드 완료!");

        const payload: CreateLocationPayload = {
          locationData: {
            ...locationData,
            image_url: finalImageUrl,
            emergency_contacts: emergencyContacts
              .filter((c) => c.name && c.contact_number)
              .map(({ id, ...rest }) => rest),
            start_date:
              periodType === "period" && dateRange?.from
                ? format(dateRange.from, "yyyy-MM-dd")
                : null,
            end_date:
              periodType === "period" && dateRange?.to
                ? format(dateRange.to, "yyyy-MM-dd")
                : null,
          },
          files: uploadedFiles,
        };

        toast.info("서버에 등록 및 AI 분석을 요청합니다...");
        const response = await createLocation(payload);

        if (response.success && response.location_id) {
          toast.success(
            response.message || "새로운 장소가 성공적으로 등록되었습니다!"
          );
          router.push(`/item/${response.location_id}`);
        } else {
          throw new Error(response.error || "알 수 없는 서버 오류");
        }
      } catch (error: any) {
        console.error("Submit error:", error);
        let errorMessage = "알 수 없는 오류가 발생했습니다.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast.error(errorMessage);
      }
    });
  }, [
    locationData,
    imageFile,
    dataFiles,
    emergencyContacts,
    periodType,
    dateRange,
    router,
  ]);

  return {
    states: {
      locationData,
      periodType,
      dateRange,
      emergencyContacts,
      dataFiles,
      imagePreview,
      isPending,
    },
    setters: {
      setLocationData,
      setPeriodType,
      setDateRange,
    },
    handlers: {
      handleInputChange,
      handleAddressComplete,
      handleImageChange,
      addEmergencyContact,
      removeEmergencyContact,
      handleEmergencyContactChange,
      handleDataFileChange,
      removeDataFile,
      updateDataFileDescription,
      handleSubmit,
    },
  };
}
