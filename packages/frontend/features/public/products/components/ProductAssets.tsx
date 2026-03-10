import Image from "next/image"

type Props = {
    product: any
}

export default function ProductAssets({ product }: Props) {

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
                    Ürün görseli bulunamadı
                </div>
            )}

            {/* TECHNICAL DRAWINGS */}

            {technicalDrawings?.length > 0 && (
                <div>

                    <h3 className="text-sm font-medium mb-3">
                        Teknik Çizimler
                    </h3>

                    <div className="grid grid-cols-3 gap-3">

                        {technicalDrawings.map((asset: any) => (

                            <div
                                key={asset.id}
                                className="relative aspect-square border rounded-lg overflow-hidden"
                            >

                                <Image
                                    src={asset.url}
                                    alt="Teknik çizim"
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
                        Ürün Görselleri
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