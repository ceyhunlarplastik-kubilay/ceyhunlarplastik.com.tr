import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProductsSection } from "@/components/home/ProductsMarquee";
import { QualitySection } from "@/components/home/QualitySection";
import { ProcessAndContactSection } from "@/components/home/ProcessAndContactSection";
import { Enviroment } from "@/components/home/Enviroment";
import { HomeToasts } from "@/components/home/HomeToasts";
import ProductAssistantModal from "@/components/home/ProductAssistantModal"
// import { getAttributesForFilter } from "@/features/admin/productAttributes/server/getAttributesForFilter"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"

export default async function Home({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;

    const error = typeof params?.error === "string" ? params.error : undefined;

    const attributes = await getAttributesForFilter()

    return (
        <div className="min-h-screen">
            {/* Toast sadece gerekiyorsa çalışsın */}
            <HomeToasts error={error} />
            {/* <main className="[padding-top:var(--navbar-height)] max-w-8xl mx-auto"> */}
            <main className="max-w-8xl mx-auto">
                <HeroSection />
                <AboutSection />
                <ServicesSection />
                <ProductsSection />
                <QualitySection />
                <ProcessAndContactSection />
                <Enviroment />
                <ProductAssistantModal attributes={attributes} />
            </main>
        </div>
    );
}
