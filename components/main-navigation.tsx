import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Map, Plus } from "lucide-react"

export default function MainNavigation() {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">주요 서비스</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/search" passHref>
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Search className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">여행 정보 찾기</h3>
                <p className="text-sm text-gray-600">안전한 여행지를 검색하고 확인하세요.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/map" passHref>
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Map className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">지도 보기</h3>
                <p className="text-sm text-gray-600">사고 및 안전 지도를 확인하세요.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/register" passHref>
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Plus className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">여행지 등록하기</h3>
                <p className="text-sm text-gray-600">새로운 안전 여행지를 등록하세요.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  )
}
