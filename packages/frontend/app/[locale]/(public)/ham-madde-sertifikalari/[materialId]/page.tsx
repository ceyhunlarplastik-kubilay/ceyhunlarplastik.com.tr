import { notFound } from "next/navigation"
import { PageHero } from "@/components/sections/PageHero"
import { MaterialCertificateCard } from "@/features/public/materials/components/MaterialCertificateCard"
import { getMaterial } from "@/features/public/materials/server/getMaterial"

type PageProps = {
    params: Promise<{ materialId: string }>
}

export default async function MaterialCertificateDetailPage({ params }: PageProps) {
    const { materialId } = await params
    const material = await getMaterial(materialId)

    if (!material) notFound()

    const certificates = (material.assets ?? []).filter(
        (asset) => asset.type === "PDF" && asset.role === "CERTIFICATE",
    )
    const title = material.code ? `${material.name} (${material.code})` : material.name

    return (
        <main className="min-h-screen bg-neutral-50/30">
            <PageHero
                title={title}
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ham Madde Sertifikaları", href: "/ham-madde-sertifikalari" },
                    { label: material.name },
                ]}
            />

            <section
                className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 md:py-8 lg:px-8"
                aria-labelledby="material-certificate-heading"
            >
                {certificates.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                        Bu ham madde için yayınlanmış sertifika bulunmuyor.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-4">
                        {certificates.map((certificate, index) => (
                            <MaterialCertificateCard
                                key={certificate.id}
                                title={title}
                                subtitle={certificates.length > 1 ? `Sertifika ${index + 1}` : undefined}
                                certificate={certificate}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}
