import Header from "@/components/header";
import IntegratedMapComponent from "@/components/integrated-map-component";

export const dynamic = "force-dynamic";

export default function MapPage() {
  return (
    <div className="h-screen bg-secondary overflow-hidden">
      <Header />
      <div className="relative h-[calc(100dvh-3.5rem)] min-h-[320px]">
        <IntegratedMapComponent />
      </div>
    </div>
  );
}
