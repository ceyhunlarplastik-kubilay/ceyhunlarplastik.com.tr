import type { Metadata } from "next";
import { HrHero, HrContactForm } from "@/features/public/hr";

const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "İnsan Kaynakları",
    description:
        "Ceyhunlar Plastik İnsan Kaynakları başvuru sayfası.",
    url: "https://ceyhunlarplastik.com.tr/ik",
};

export const metadata: Metadata = {
    title: "İnsan Kaynakları | Ceyhunlar Plastik",
    description:
        "Ceyhunlar Plastik ailesine katılın. İnsan Kaynakları başvuru formu üzerinden CV’nizi gönderin.",
    keywords: [
        "Ceyhunlar Plastik",
        "İnsan Kaynakları",
        "İş Başvurusu",
        "Kariyer",
        "Plastik Sektörü",
    ],
    openGraph: {
        title: "İnsan Kaynakları | Ceyhunlar Plastik",
        description:
            "Ceyhunlar Plastik ailesine katılın. CV’nizi gönderin.",
        type: "website",
        url: "https://ceyhunlarplastik.com.tr/ik",
        images: [
            {
                url: "/logos/hr.jpg",
                width: 1200,
                height: 630,
                alt: "Ceyhunlar Plastik İnsan Kaynakları",
            },
        ],
    },
    alternates: {
        canonical: "https://ceyhunlarplastik.com.tr/ik",
    },
    other: {
        "application/ld+json": JSON.stringify(structuredData),
    },
};

export default function HumanResources() {
    return (
        <main>
            <HrHero />
            <HrContactForm />
        </main>
    );
}