import { PageHero } from "@/components/sections/PageHero"
import { MaterialCertificateCard } from "@/features/public/materials/components/MaterialCertificateCard"
import { getMaterials } from "@/features/public/materials/server/getMaterials"

export default async function MaterialCertificatesPage() {
    const materials = await getMaterials()

    const certificateItems = materials.flatMap((material) =>
        (material.assets ?? [])
            .filter((asset) => asset.type === "PDF" && asset.role === "CERTIFICATE")
            .map((asset, index) => ({
                material,
                asset,
                title: material.code ? `${material.name} (${material.code})` : material.name,
                subtitle: material.assets && material.assets.length > 1 ? `Sertifika ${index + 1}` : undefined,
            })),
    )

    return (
        <main className="min-h-screen bg-neutral-50/30">
            <PageHero
                title="Ham Madde Sertifikaları"
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ham Madde Sertifikaları" },
                ]}
            />

            <section
                className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 md:py-8 lg:px-8"
                aria-labelledby="material-certificates-heading"
            >
                {certificateItems.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                        Yayında ham madde sertifikası bulunmuyor.
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
