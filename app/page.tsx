import Header from "@/components/header"
import IntegratedMapComponent from "@/components/integrated-map-component"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      {" "}
      {/* overflow-hidden 추가 */}
      <Header />
      <IntegratedMapComponent /> {/* 통합 지도 및 드래그 가능한 시트 */}
    </div>
  )
}
