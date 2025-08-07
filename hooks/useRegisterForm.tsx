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
    type: "관광지",
    description: "",
    image_url: null,
    category: "",
    status: "운영중",
    start_time: null,
    end_time: null,
    expected_attendees: "", // 빈 문자열로 초기화
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // "data:*/*;base64," 부분을 제거합니다.
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = useCallback(async () => {
    startTransition(async () => {
      try {
        toast.info(
          "새로운 장소 등록 및 AI 분석을 시작합니다. 최대 1분까지 소요될 수 있습니다."
        );

        // 외부 API는 단일 파일의 Base64 문자열을 기대합니다.
        // 업로드된 파일(첨부파일 또는 대표 이미지) 중 첫 번째 파일 하나만 선택합니다.
        let relatedDocumentsBase64 = "";
        const fileToUpload = dataFiles[0]?.file || imageFile;

        if (fileToUpload) {
          relatedDocumentsBase64 = await fileToBase64(fileToUpload);
        }

        const period =
          periodType === "period"
            ? `${
                dateRange?.from ? format(dateRange.from, "yyyy년 M월 d일") : ""
              } ~ ${
                dateRange?.to ? format(dateRange.to, "yyyy년 M월 d일") : ""
              }`
            : "상시";

        const mainEmergencyContact = emergencyContacts[0] || {};

        const payload = {
          place_name: locationData.name || "",
          type: locationData.type || "",
          location: locationData.location || "",
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          period: period,
          description: locationData.description || "",
          category: locationData.category || "",
          related_documents: relatedDocumentsBase64,
          emergency_contact_name: mainEmergencyContact.name || "",
          emergency_contact_phone: mainEmergencyContact.contact_number || "",
          expected_attendees: locationData.expected_attendees || "",
        };

        const response = await fetch("/api/custom_form", {
          // custom_form으로 수정
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationData: {
              ...locationData,
              start_date:
                periodType === "period" && dateRange?.from
                  ? format(dateRange.from, "yyyy-MM-dd")
                  : null,
              end_date:
                periodType === "period" && dateRange?.to
                  ? format(dateRange.to, "yyyy-MM-dd")
                  : null,
            },
            aiRequest: payload,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "AI 서버와의 통신 중 오류가 발생했습니다."
          );
        }

        const result = await response.json();

        toast.success(
          result.message || "새로운 장소가 성공적으로 등록되었습니다!"
        );
        window.location.href = "/";
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
