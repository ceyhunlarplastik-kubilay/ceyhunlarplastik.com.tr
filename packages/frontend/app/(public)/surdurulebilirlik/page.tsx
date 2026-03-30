import type { Metadata } from "next";
import { Enviroment } from "@/components/home/Enviroment";
import { SustainabilityIntro } from "@/features/public/sustainability/components/SustainabilityIntro";
import { SustainabilityImpact } from "@/features/public/sustainability/components/SustainabilityImpact";
import { SustainabilityEnergy } from "@/features/public/sustainability/components/SustainabilityEnergy";

export const metadata: Metadata = {
    title: "Sürdürülebilirlik | Ceyhunlar Plastik",
    description:
        "Ceyhunlar Plastik sürdürülebilir üretim ve çevre dostu yaklaşımı.",
};

export default function SustainabilityPage() {
    return (
        <main>
            <Enviroment fullScreen />
            <SustainabilityIntro />
            <SustainabilityImpact />
            <SustainabilityEnergy />
        </main>
    );
}
