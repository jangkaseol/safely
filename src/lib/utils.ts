import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "날짜 정보 없음";
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "유효하지 않은 날짜";
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();

    const period = hours >= 12 ? "오후" : "오전";
    hours = hours % 12;
    if (hours === 0) {
      hours = 12; // 0시는 12시로 표시
    }

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${year}년 ${month}월 ${day}일 ${period} ${hours}시 ${formattedMinutes}분`;
  } catch (error) {
    console.error("날짜 형식 변환 중 오류 발생:", error);
    return dateString; // 오류 발생 시 원본 문자열 반환
  }
}
