import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProductsSection } from "@/components/home/ProductsMarquee";
import { QualitySection } from "@/components/home/QualitySection";
import { ProcessAndContactSection } from "@/components/home/ProcessAndContactSection";
import { Enviroment } from "@/components/home/Enviroment";
import { HomeToasts } from "@/components/home/HomeToasts";
import ProductAssistantModal from "@/components/home/ProductAssistantModal"
import { getAssistantAttributes } from "@/features/public/productAttributes/server/getAttributesForFilter"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { setRequestLocale } from "next-intl/server"

// ISR: sayfa CDN'de cache'lenir ve 60 sn'de bir arka planda yenilenir.
// searchParams KULLANILMAZ — aksi halde route dynamic'e düşer ve her istek
// cold-start riskli tam-SSR olur (error param'ı HomeToasts client tarafında okur).
export const revalidate = 60;

export default async function Home({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Kategoriler navbar için zaten çekiliyor; aynı (cache'li) veriyi ProductsSection'a
    // initialData olarak geçerek client'taki ikinci /categories fetch'ini de öldürüyoruz.
    const [attributes, categories] = await Promise.all([
        getAssistantAttributes(locale),
        getCategories(locale),
    ]);

    return (
        <div className="min-h-screen">
            {/* Toast sadece gerekiyorsa çalışsın (error param'ı client'ta okunur) */}
            <HomeToasts />
            <div className="max-w-8xl mx-auto">
                <HeroSection />
                <AboutSection />
                <ServicesSection />
                <ProductsSection initialCategories={categories} />
                <QualitySection />
                <ProcessAndContactSection />
                <Enviroment />
                <ProductAssistantModal attributes={attributes} />
            </div>
        </div>
    );
}
