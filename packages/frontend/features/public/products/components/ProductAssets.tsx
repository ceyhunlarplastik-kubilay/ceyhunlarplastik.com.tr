import Image from "next/image"
import { getTranslations } from "next-intl/server"

type Props = {
    product: any
}

export default async function ProductAssets({ product }: Props) {

    const t = await getTranslations("public.productDetail.assetsGallery")

    const primary = product.assets?.find((a: any) => a.role === "PRIMARY")
    const animation = product.assets?.find((a: any) => a.role === "ANIMATION")

    const gallery = product.assets?.filter((a: any) => a.role === "GALLERY")

    const technicalDrawings = product.assets?.filter(
        (a: any) => a.role === "TECHNICAL_DRAWING"
    )

    return (
        <div className="space-y-6">

            {/* PRIMARY IMAGE */}

            {primary ? (
                <div className="relative aspect-square rounded-xl overflow-hidden border bg-white">

                    <Image
                        src={primary.url}
                        alt={product.name}
                        fill
                        className="object-contain"
                    />

                </div>
            ) : (
                <div className="aspect-square flex items-center justify-center text-neutral-400 border rounded-xl">
                    {t("imageMissing")}
                </div>
            )}

            {/* TECHNICAL DRAWINGS */}

            {technicalDrawings?.length > 0 && (
                <div>

                    <h3 className="text-sm font-medium mb-3">
                        {t("technicalDrawings")}
                    </h3>

                    <div className="grid grid-cols-3 gap-3">

                        {technicalDrawings.map((asset: any) => (

                            <div
                                key={asset.id}
                                className="relative aspect-square border rounded-lg overflow-hidden"
                            >

                                <Image
                                    src={asset.url}
                                    alt={t("technicalAlt")}
                                    fill
                                    className="object-contain"
                                />

                            </div>

                        ))}

                    </div>

                </div>
            )}

            {/* GALLERY */}

            {gallery?.length > 0 && (
                <div>

                    <h3 className="text-sm font-medium mb-3">
                        {t("productImages")}
                    </h3>

                    <div className="grid grid-cols-3 gap-3">

                        {gallery.map((asset: any) => (

                            <div
                                key={asset.id}
                                className="relative aspect-square border rounded-lg overflow-hidden"
                            >

                                <Image
                                    src={asset.url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />

                            </div>

                        ))}

                    </div>

                </div>
            )}

        </div>
    )
}