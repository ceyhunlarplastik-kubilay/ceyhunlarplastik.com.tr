import type { Metadata } from "next";

// metadataBase env'den gelir — domain geçici olarak ceyhunlarplastik.xyz olduğu
// için hardcode edilmez (eskiden .com.tr hardcode'du ve OG/canonical yanlış
// domain'e işaret ediyordu). NEXTAUTH_URL infra tarafından stage'e göre set edilir.
export const siteUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.DOMAIN && process.env.DOMAIN !== "DOMAIN"
        ? `https://${process.env.DOMAIN}`
        : "http://localhost:3000");

export const baseMetadata: Metadata = {
    metadataBase: new URL(siteUrl),

    title: {
        default: "Ceyhunlar Plastik",
        template: "%s | Ceyhunlar Plastik",
    },

    description:
        "Ceyhunlar Plastik – plastik, bakalit ve metal parçalar için yüksek hassasiyetli üretim çözümleri.",

    openGraph: {
        siteName: "Ceyhunlar Plastik",
        locale: "tr_TR",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
    },
    icons: {
        icon: [{ url: "/favicon-5312.png", type: "image/png" }],
        shortcut: ["/favicon-5312.png"],
        apple: [{ url: "/favicon-5312.png" }],
    },
};
