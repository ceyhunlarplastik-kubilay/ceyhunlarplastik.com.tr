"use client"

import Link from "next/link"
import { ArrowLeft, Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"

type Props = {
    productSlug: string
    productName: string
    productCode: string
    categoryName: string
    selectedMeasurementSummary: string
    variantCount: number
    description?: string | null
}

export function CustomerPortalVariantPageHeader({
    productSlug,
    productName,
    productCode,
    categoryName,
    selectedMeasurementSummary,
    variantCount,
    description,
}: Props) {
    return (
        <CustomerPortalPageHeader
            eyebrow="Varyant Detayı"
            icon={Ruler}
            title={productName}
            /* description={description || "Seçili ölçü grubuna ait varyantları, teknik çizimi ve müşteri fiyat seçeneklerini inceleyin."} */
            meta={[
                { value: productCode, label: "ürün kodu" },
                { value: categoryName, label: "kategori" },
                { value: selectedMeasurementSummary, label: "seçili ölçü" },
                { value: `${variantCount}`, label: "varyant" },
            ]}
            aside={(
                <Button asChild variant="outline" className="w-full justify-start gap-2 bg-white/80 xl:w-auto">
                    <Link href={`/musteri/tum-urunler/urun/${productSlug}`}>
                        <ArrowLeft className="h-4 w-4" />
                        Ürün Modeline Dön
                    </Link>
                </Button>
            )}
        />
    )
}
