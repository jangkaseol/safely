"use client";

import { useState, useCallback, useTransition } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { createLocation } from "@/app/actions/register";
import { uploadFile } from "@/lib/file-upload";
import { submitCustomForm } from "@/lib/api-client";
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export function useRegisterForm() {
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
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      }
    },
    [imagePreview]
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
    const { name, type, location } = locationData;
    if (!name || !type || !location) {
      toast.error("이름/명칭, 유형, 상세 위치는 필수 입력 항목입니다.");
      return;
    }

    if (periodType === "period" && (!dateRange?.from || !dateRange?.to)) {
      toast.error("기간을 선택해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        toast.info(
          "새로운 장소 등록 및 AI 분석을 시작합니다. 최대 1분까지 소요될 수 있습니다."
        );

        let imageUrl: string | null = null;
        if (imageFile) {
          const uploadedImage = await uploadFile(imageFile);
          imageUrl = uploadedImage.url;
        }

        let relatedDocumentsBase64 = "";
        if (dataFiles.length > 0 && dataFiles[0].file) {
          relatedDocumentsBase64 = await fileToBase64(dataFiles[0].file);
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

        const dbLocationData = {
          name: locationData.name,
          location: locationData.location,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          type: locationData.type,
          description: locationData.description,
          image_url: imageUrl,
          category: locationData.category,
          status: locationData.status,
          expected_attendees: locationData.expected_attendees,
          emergency_contacts: emergencyContacts,
          start_date:
            periodType === "period" && dateRange?.from
              ? format(dateRange.from, "yyyy-MM-dd")
              : null,
          end_date:
            periodType === "period" && dateRange?.to
              ? format(dateRange.to, "yyyy-MM-dd")
              : null,
          start_time: locationData.start_time,
          end_time: locationData.end_time,
        };

        const aiPayload = {
          place_name: locationData.name || "",
          type: locationData.type || "",
          location: locationData.location,
          period: period,
          description: locationData.description || "",
          category: locationData.category || "",
          related_documents: relatedDocumentsBase64,
          emergency_contact_name: mainEmergencyContact.name || "",
          emergency_contact_phone: mainEmergencyContact.contact_number || "",
          expected_attendees: locationData.expected_attendees || "",
        };

        const result = await submitCustomForm({
          locationData: dbLocationData,
          aiRequest: aiPayload,
        });

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
