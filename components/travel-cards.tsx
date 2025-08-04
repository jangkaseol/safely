"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star } from "lucide-react"

const travelData = [
  {
    id: 1,
    title: "강릉시",
    subtitle: "제 주특별자치도 서귀포시 가가로 14",
    description: "바다도",
    image: "/placeholder.svg?height=200&width=300",
    badge: "경상지",
  },
  {
    id: 2,
    title: "김영화",
    subtitle: "경기 성남시 분당구 서판교로 32",
    description: "23구",
    image: "/placeholder.svg?height=200&width=300",
    badge: "경상지",
  },
  {
    id: 3,
    title: "12341234",
    subtitle: "qwer1234r",
    description: "",
    image: "/placeholder.svg?height=200&width=300",
    badge: "경상지",
  },
]

export default function TravelCards() {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {travelData.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="relative">
                <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-48 object-cover" />
                <Badge className="absolute top-3 left-3 bg-gray-800 text-white">{item.badge}</Badge>
                <button className="absolute top-3 right-3 p-1 bg-white rounded-full shadow-md hover:bg-gray-50">
                  <Star className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{item.subtitle}</span>
                </div>
                {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            더 보기
          </button>
        </div>
      </div>
    </section>
  )
}
