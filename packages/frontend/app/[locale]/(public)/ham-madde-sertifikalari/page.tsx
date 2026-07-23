import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { PageHero } from "@/components/sections/PageHero"
import { MaterialCertificateCard } from "@/features/public/materials/components/MaterialCertificateCard"
import { getMaterials } from "@/features/public/materials/server/getMaterials"

type PageProps = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "public.materials.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: locale === "tr" ? "/ham-madde-sertifikalari" : "/en/ham-madde-sertifikalari",
            languages: {
                tr: "/ham-madde-sertifikalari",
                en: "/en/ham-madde-sertifikalari",
                "x-default": "/ham-madde-sertifikalari",
            },
        },
        openGraph: {
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
    }
}

export default async function MaterialCertificatesPage({ params }: PageProps) {
    const { locale } = await params
    setRequestLocale(locale)

    const [t, tb, materials] = await Promise.all([
        getTranslations({ locale, namespace: "public.materials" }),
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getMaterials({ locale }),
    ])

    const certificateItems = materials.flatMap((material) =>
        (material.assets ?? [])
            .filter((asset) => asset.type === "PDF" && asset.role === "CERTIFICATE")
            .map((asset, index) => ({
                material,
                asset,
                title: material.code ? `${material.name} (${material.code})` : material.name,
                subtitle: material.assets && material.assets.length > 1 ? t("certificateSuffix", { number: index + 1 }) : undefined,
            })),
    )

    return (
        <main className="min-h-screen bg-neutral-50/30">
            <PageHero
                title={t("heroTitle")}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: t("breadcrumbSelf") },
                ]}
            />

            <section
                className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 md:py-8 lg:px-8"
                aria-labelledby="material-certificates-heading"
            >
                {certificateItems.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                        {t("empty")}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-4">
                        {certificateItems.map(({ asset, title, subtitle }) => (
                            <MaterialCertificateCard
                                key={asset.id}
                                title={title}
                                subtitle={subtitle}
                                certificate={asset}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}
