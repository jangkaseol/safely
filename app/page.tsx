import Header from "@/components/header";
import IntegratedMapComponent from "@/components/integrated-map-component";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 relative">
        <IntegratedMapComponent />
      </div>
    </div>
  );
}
