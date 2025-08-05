"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PERIOD_TYPE,
  LOCATION_TYPES as LOCATION_TYPE_VALUES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

import AddressSearch from "./AddressSearch";
import { useRegisterForm } from "@/hooks/useRegisterForm";

const REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const LOCATION_TYPES = Object.values(LOCATION_TYPE_VALUES);

export default function RegisterForm() {
  const { states, setters, handlers } = useRegisterForm();
  const {
    locationData,
    periodType,
    dateRange,
    emergencyContacts,
    dataFiles,
    imagePreview,
    isPending,
  } = states;

  const { setPeriodType, setDateRange } = setters;
  const {
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
  } = handlers;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-xl">기본 정보</CardTitle>
          <CardDescription>
            여행지의 이름, 위치, 유형 등 필수 정보를 입력합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="name">이름/명칭</Label>
              <Input
                id="name"
                name="name"
                placeholder="여행지 또는 축제 이름"
                value={locationData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="type">유형</Label>
              <Select
                name="type"
                value={locationData.type ?? LOCATION_TYPES[0]}
                onValueChange={(value) =>
                  handleInputChange({ target: { name: "type", value } } as any)
                }
                required>
                <SelectTrigger>
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="location">상세 위치</Label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <Input
                  id="location"
                  name="location"
                  placeholder="주소 검색 버튼을 클릭하세요"
                  value={locationData.location}
                  readOnly
                  required
                  className="flex-grow"
                />
                <AddressSearch onComplete={handleAddressComplete} />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="region">지역</Label>
              <Select
                name="region"
                value={locationData.region ?? ""}
                onValueChange={(value) =>
                  handleInputChange({
                    target: { name: "region", value },
                  } as any)
                }
                required>
                <SelectTrigger>
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r: string) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>기간 및 운영시간</Label>
            <div className="flex flex-col gap-4">
              <RadioGroup
                value={periodType}
                onValueChange={(value) =>
                  setPeriodType(value as "always" | "period")
                }
                className="flex items-center space-x-2">
                <Label
                  htmlFor="always"
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors">
                  <RadioGroupItem
                    value={PERIOD_TYPE.ALWAYS}
                    id="always"
                    className="size-6"
                  />
                  <span className="font-normal text-sm sm:text-base">상시</span>
                </Label>
                <Label
                  htmlFor="period"
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors">
                  <RadioGroupItem
                    value={PERIOD_TYPE.PERIOD}
                    id="period"
                    className="size-6"
                  />
                  <span className="font-normal text-sm sm:text-base">
                    기간 지정
                  </span>
                </Label>
              </RadioGroup>

              <div
                className={cn(periodType !== PERIOD_TYPE.PERIOD && "hidden")}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "yyyy-MM-dd")} ~{" "}
                            {format(dateRange.to, "yyyy-MM-dd")}
                          </>
                        ) : (
                          format(dateRange.from, "yyyy-MM-dd")
                        )
                      ) : (
                        <span>기간 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full space-y-2">
                  <Label htmlFor="start_time">시작 시간</Label>
                  <Input
                    id="start_time"
                    type="time"
                    name="start_time"
                    value={locationData.start_time || ""}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div className="hidden sm:block pt-6">~</div>
                <div className="w-full space-y-2">
                  <Label htmlFor="end_time">종료 시간</Label>
                  <Input
                    id="end_time"
                    type="time"
                    name="end_time"
                    value={locationData.end_time || ""}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="장소에 대한 자세한 설명을 입력하세요."
              rows={5}
              value={locationData.description ?? ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="image_url">대표 이미지</Label>
              <Input
                id="image_url"
                name="image_url"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="relative mt-2 h-48 w-full">
                  <Image
                    src={imagePreview}
                    alt="이미지 미리보기"
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category">카테고리</Label>
              <Input
                id="category"
                name="category"
                placeholder="예: 문화유산, 자연명소, 음식/문화"
                value={locationData.category ?? ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-xl">상세 정보</CardTitle>
          <CardDescription>
            AI 분석에 사용될 파일이나 비상 시 연락처를 추가할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-0">
          <div className="space-y-4">
            <Label className="text-base font-medium">
              관련 데이터 첨부 (선택)
            </Label>
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                파일을 끌어다 놓거나 클릭하여 업로드
              </p>
              <Button asChild variant="outline" className="mt-4 text-sm">
                <label>
                  파일 선택
                  <Input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleDataFileChange}
                    accept=".pdf,.docx,.doc,.jpg,.png"
                  />
                </label>
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                PDF, DOCX, DOC, JPG, PNG (HWP 미지원)
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {dataFiles.map((df) => (
                <div
                  key={df.id}
                  className="flex items-center gap-2 rounded-md border bg-gray-50 p-3">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium truncate">
                      {df.file_name}
                    </p>
                    <Input
                      placeholder="파일 설명 입력"
                      value={df.description ?? ""}
                      onChange={(e) =>
                        updateDataFileDescription(df.id, e.target.value)
                      }
                      className="bg-white h-8 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDataFile(df.id)}
                    className="flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">응급 연락처 (선택)</Label>
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="space-y-4 rounded-md border p-4">
                <div className="grid grid-cols-1 gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`contactName-${contact.id}`}>
                      기관/담당자명
                    </Label>
                    <Input
                      id={`contactName-${contact.id}`}
                      placeholder="예: 관리사무소"
                      value={contact.name}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          contact.id,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contactNumber-${contact.id}`}>
                      연락처
                    </Label>
                    <Input
                      id={`contactNumber-${contact.id}`}
                      placeholder="02-123-4567"
                      value={contact.contact_number}
                      onChange={(e) =>
                        handleEmergencyContactChange(
                          contact.id,
                          "contact_number",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmergencyContact(contact.id)}
                  disabled={emergencyContacts.length <= 1}
                  className="w-full text-red-500">
                  - 연락처 삭제
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addEmergencyContact}>
              + 연락처 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row-reverse gap-2 pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full sm:w-auto">
          {isPending ? "등록 중..." : "정보 등록하기"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          asChild
          className="w-full sm:w-auto">
          <Link href="/">취소</Link>
        </Button>
      </div>
    </form>
  );
}
