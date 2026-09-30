import type { ReferenceVariantVersion } from "@/features/production/references/api/types"

/** `GET /production/variants` — iç üretim tedarikçisine bağlı katalog varyantı + üretim profili. */
export type ProductionVariant = {
    id: string
    /** "10.5.8.V1" */
    fullCode: string
    product: { id: string; code: string; name: string }
    size: { id: string; code: number; sizeCode: string; label: string }
    version: ReferenceVariantVersion
    /** Ölçüyü basan, kullanım dışı olmayan kalıp sayısı — 0 ise henüz üretilemez. */
    usableMoldCount: number
    /** Varyanta özel çevrim (sn); girilmemişse `null`. */
    cycleTimeSec: number | null
    profileUpdatedAt: string | null
}

export type ProductionVariantListQuery = { page: number; limit: number; q: string }

export type ProductionVariantList = {
    data: ProductionVariant[]
    meta: { page: number; limit: number; total: number; totalPages: number }
}
