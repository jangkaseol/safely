"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")

  return (
    <section className="bg-white py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">여행 정보 찾기</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="장소나 주제명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="전체 지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 지역</SelectItem>
              <SelectItem value="seoul">서울</SelectItem>
              <SelectItem value="busan">부산</SelectItem>
              <SelectItem value="gangneung">강릉</SelectItem>
              <SelectItem value="jeju">제주</SelectItem>
            </SelectContent>
          </Select>

          <Button className="w-full sm:w-auto">
            <Search className="w-4 h-4 mr-2" />
            검색
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-4">총 28개의 결과를 찾았습니다.</p>
      </div>
    </section>
  )
}
