"use client"

import {
    BadgePercent,
    Building2,
    FileBadge2,
    PackageSearch,
} from "lucide-react"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"
import { CustomerPortalRequestComposer } from "@/features/customerPortal/components/CustomerPortalRequestComposer"
import type { PortalBusinessRequestInput } from "@/features/businessRequests/api/types"

const meta = {
    CUSTOMER_PROFILE_CHANGE: {
        eyebrow: "Profil Akışı",
        title: "Profil Değişikliği Talebi",
        description: "Firma, iletişim ve adres değişikliği taleplerinizi kontrollü şekilde satış onay akışına gönderin.",
        icon: Building2,
        forceDraftOpen: false,
    },
    CUSTOMER_ORDER_REQUEST: {
        eyebrow: "Sipariş Akışı",
        title: "Sipariş Talebi Oluştur",
        description: "Sepetteki varyantları gözden geçirip termin, adres ve ticari notlarla sipariş talebine dönüştürün.",
        icon: PackageSearch,
        forceDraftOpen: true,
    },
    CUSTOMER_DOCUMENT_REQUEST: {
        eyebrow: "Döküman Akışı",
        title: "Döküman Talebi Oluştur",
        description: "Teknik çizim, sertifika, katalog veya 3D model gibi ihtiyaçları net bir brief ile iletin.",
        icon: FileBadge2,
        forceDraftOpen: false,
    },
    CUSTOMER_PRICING_REQUEST: {
        eyebrow: "Fiyat Akışı",
        title: "Fiyat Talebi Oluştur",
        description: "Sepetteki kalemler için güncel teklif, hedef fiyat ve ticari beklentiyi birlikte iletin.",
        icon: BadgePercent,
        forceDraftOpen: true,
    },
} satisfies Record<PortalBusinessRequestInput["type"], {
    eyebrow: string
    title: string
    description: string
    icon: typeof Building2
    forceDraftOpen: boolean
}>

type Props = {
    type: PortalBusinessRequestInput["type"]
}

export function CustomerPortalRequestCreatePageClient({ type }: Props) {
    const content = meta[type]

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow={content.eyebrow}
                icon={content.icon}
                title={content.title}
                description={content.description}
            />

            <CustomerPortalRequestComposer
                forcedType={type}
                forceDraftOpen={content.forceDraftOpen}
                showTypePicker={false}
            />
        </div>
    )
}
