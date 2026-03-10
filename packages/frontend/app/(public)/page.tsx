import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProductsSection } from "@/components/home/ProductsMarquee";
import { QualitySection } from "@/components/home/QualitySection";
import { ProcessAndContactSection } from "@/components/home/ProcessAndContactSection";
import { Enviroment } from "@/components/home/Enviroment";
import { HomeToasts } from "@/components/home/HomeToasts";

export default async function Home({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;

    const error = typeof params?.error === "string" ? params.error : undefined;

    return (
        <div className="min-h-screen">
            {/* Toast sadece gerekiyorsa çalışsın */}
            <HomeToasts error={error} />
            <main className="[padding-top:var(--navbar-height)] max-w-8xl mx-auto">
                <HeroSection />
                <AboutSection />
                <ServicesSection />
                <ProductsSection />
                <QualitySection />
                <ProcessAndContactSection />
                <Enviroment />
            </main>
        </div>
    );
}