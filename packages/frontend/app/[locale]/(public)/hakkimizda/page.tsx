import type { Metadata } from "next";
import AboutHero from "@/features/public/about/components/AboutHero";
import AboutContent from "@/features/public/about/components/AboutContent";
import AboutCategories from "@/features/public/about/components/AboutCategories";
import { AboutDetails } from "@/features/public/about/components/AboutDetails";

export const metadata: Metadata = {
    title: "Hakkımızda | Ceyhunlar Plastik",
    description:
        "Ceyhunlar Plastik hakkında detaylı bilgi. 2001’den beri üretim, kalite ve güven.",
    openGraph: {
        title: "Hakkımızda | Ceyhunlar Plastik",
        description: "Ceyhunlar Plastik hakkında bilgi alın.",
        type: "website",
        // url: "https://ceyhunlarplastik.com.tr/hakkimizda",
        url: "/hakkimizda.jpg",
        images: [
            {
                url: "/hakkimizda.jpg",
                width: 1200,
                height: 630,
                alt: "Ceyhunlar Plastik",
            },
        ],
    },
};

export default function AboutPage() {
    return (
        <main>
            <AboutHero />
            <AboutContent />
            <AboutCategories />
            <AboutDetails />
            {/* diğer 4 component buraya gelecek */}
        </main>
    );
}