import type { LucideIcon } from "lucide-react"
import {
    BadgePercent,
    Building2,
    FileBadge2,
    PackageSearch,
} from "lucide-react"
import { z } from "zod"
import { CUSTOMER_PORTAL_REQUEST_TYPES } from "@/features/businessRequests/config"

const optionalEmailSchema = z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((value) => {
        if (!value) return true
        return z.string().email().safeParse(value).success
    }, {
        message: "Gecerli bir e-posta girin.",
    })

export const addressDraftSchema = z.object({
    label: z.string().trim().max(80),
    contactName: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(40).optional(),
    email: optionalEmailSchema,
    countryId: z.number().int().positive().nullable().optional(),
    stateId: z.number().int().positive().nullable().optional(),
    cityId: z.number().int().positive().nullable().optional(),
    country: z.string().trim().max(80).optional(),
    stateName: z.string().trim().max(120).optional(),
    city: z.string().trim().max(80),
    district: z.string().trim().max(80).optional(),
    line1: z.string().trim().max(240),
    line2: z.string().trim().max(240).optional(),
    postalCode: z.string().trim().max(30).optional(),
    taxOffice: z.string().trim().max(120).optional(),
    taxNumber: z.string().trim().max(32).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    locationSource: z.enum(["MANUAL_PIN", "GEOCODED", "IMPORTED", "CUSTOMER_SUBMITTED"]).nullable().optional(),
    locationAccuracy: z.enum(["EXACT", "STREET", "DISTRICT", "CITY", "UNKNOWN"]).nullable().optional(),
    geocodingProvider: z.string().trim().max(80).optional(),
    geocodingPlaceId: z.string().trim().max(255).optional(),
    geocodingLabel: z.string().trim().max(500).optional(),
    geocodingRaw: z.unknown().optional(),
    geocodedAt: z.string().trim().max(80).optional(),
    isPrimary: z.boolean(),
    isBilling: z.boolean(),
    isShipping: z.boolean(),
    note: z.string().trim().max(1000).optional(),
})

export function hasMeaningfulAddressInput(address: z.infer<typeof addressDraftSchema>) {
    return Boolean(
        address.label.trim()
        || address.contactName?.trim()
        || address.phone?.trim()
        || address.email?.trim()
        || address.countryId
        || address.stateId
        || address.cityId
        || address.stateName?.trim()
        || address.city.trim()
        || address.district?.trim()
        || address.line1.trim()
        || address.line2?.trim()
        || address.postalCode?.trim()
        || address.taxOffice?.trim()
        || address.taxNumber?.trim()
        || address.latitude !== null
        || address.longitude !== null
        || address.geocodingLabel?.trim()
        || address.note?.trim(),
    )
}

export const documentTypeValues = [
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
    "CATALOG",
    "TEST_REPORT",
    "MATERIAL_DECLARATION",
    "THREE_D_MODEL",
    "OTHER",
] as const

export const documentTypeLabels: Record<(typeof documentTypeValues)[number], string> = {
    TECHNICAL_DRAWING: "Teknik Cizim",
    CERTIFICATE: "Sertifika / Uygunluk Belgesi",
    CATALOG: "Katalog / Brosur",
    TEST_REPORT: "Test Raporu",
    MATERIAL_DECLARATION: "Malzeme Beyani",
    THREE_D_MODEL: "3D Model / STEP",
    OTHER: "Diger",
}

export const portalRequestSchema = z.object({
    type: z.enum(CUSTOMER_PORTAL_REQUEST_TYPES),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    title: z.string().trim().max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    profileCompanyName: z.string().trim().max(160).optional(),
    profileFullName: z.string().trim().max(160).optional(),
    profilePhone: z.string().trim().max(40).optional(),
    profileEmail: optionalEmailSchema,
    profileNote: z.string().trim().max(2000).optional(),
    addresses: z.array(addressDraftSchema).max(10),
    deliveryDate: z.string().trim().optional(),
    shippingAddressId: z.string().trim().optional(),
    referenceCode: z.string().trim().max(80).optional(),
    commercialNote: z.string().trim().max(2000).optional(),
    documentTypes: z.array(z.enum(documentTypeValues)),
    documentFormat: z.string().trim().max(80).optional(),
    documentProductReference: z.string().trim().max(160).optional(),
    documentVariantReference: z.string().trim().max(160).optional(),
    documentPurpose: z.string().trim().max(2000).optional(),
    documentNeededAt: z.string().trim().optional(),
    pricingNeededAt: z.string().trim().optional(),
    pricingReason: z.string().trim().max(240).optional(),
    pricingExpectation: z.string().trim().max(240).optional(),
}).superRefine((values, ctx) => {
    if (values.type === "CUSTOMER_PROFILE_CHANGE") {
        if (!values.profileFullName?.trim()) {
            ctx.addIssue({ code: "custom", message: "Yetkili kisi bilgisi gerekli.", path: ["profileFullName"] })
        }
        if (!values.profilePhone?.trim()) {
            ctx.addIssue({ code: "custom", message: "Telefon bilgisi gerekli.", path: ["profilePhone"] })
        }
        if (!values.profileEmail?.trim()) {
            ctx.addIssue({ code: "custom", message: "E-posta bilgisi gerekli.", path: ["profileEmail"] })
        }
    }

    if (values.type === "CUSTOMER_DOCUMENT_REQUEST" && values.documentTypes.length === 0) {
        ctx.addIssue({ code: "custom", message: "En az bir dokuman tipi secin.", path: ["documentTypes"] })
    }

    if (values.type === "CUSTOMER_PROFILE_CHANGE") {
        values.addresses.forEach((address, index) => {
            if (!hasMeaningfulAddressInput(address)) return
            if (!address.label.trim()) {
                ctx.addIssue({ code: "custom", message: "Adres etiketi gerekli.", path: ["addresses", index, "label"] })
            }
            if (!address.countryId) {
                ctx.addIssue({ code: "custom", message: "Ulke secin.", path: ["addresses", index, "countryId"] })
            }
            if (!address.stateId) {
                ctx.addIssue({ code: "custom", message: "Il secin.", path: ["addresses", index, "stateId"] })
            }
            if (!address.cityId || !address.city.trim()) {
                ctx.addIssue({ code: "custom", message: "Ilce secin.", path: ["addresses", index, "cityId"] })
            }
            if (!address.line1.trim()) {
                ctx.addIssue({ code: "custom", message: "Acik adres gerekli.", path: ["addresses", index, "line1"] })
            }
        })
    }
})

export type PortalRequestFormValues = z.infer<typeof portalRequestSchema>

export function emptyAddress() {
    return {
        label: "",
        contactName: "",
        phone: "",
        email: "",
        countryId: null,
        stateId: null,
        cityId: null,
        country: "Turkiye",
        stateName: "",
        city: "",
        district: "",
        line1: "",
        line2: "",
        postalCode: "",
        taxOffice: "",
        taxNumber: "",
        latitude: null,
        longitude: null,
        locationSource: null,
        locationAccuracy: null,
        geocodingProvider: "",
        geocodingPlaceId: "",
        geocodingLabel: "",
        geocodingRaw: undefined,
        geocodedAt: "",
        isPrimary: false,
        isBilling: false,
        isShipping: true,
        note: "",
    }
}

export type AddressDraftFormValues = z.input<typeof addressDraftSchema>

export type ShippingAddressOption = z.infer<typeof addressDraftSchema> & {
    id: string
    isPersisted: boolean
}

export function buildAddressSummary(address: Pick<ShippingAddressOption, "line1" | "district" | "city" | "country">) {
    return [address.line1, address.district, address.city, address.country]
        .filter(Boolean)
        .join(", ")
}

export const requestTypeMeta: Record<typeof CUSTOMER_PORTAL_REQUEST_TYPES[number], {
    description: string
    detailTitle: string
    entityType: "CUSTOMER" | "ORDER" | "DOCUMENT" | "PRODUCT_VARIANT"
    icon: LucideIcon
    label: string
}> = {
    CUSTOMER_PROFILE_CHANGE: {
        label: "Profil Bilgisi Talebi",
        detailTitle: "Profil bilgilerinizi duzenleyin",
        description: "Firma, yetkili kisi, iletisim ve adres bilgilerinizde kontrollu degisiklik talebi olusturun.",
        entityType: "CUSTOMER",
        icon: Building2,
    },
    CUSTOMER_ORDER_REQUEST: {
        label: "Sipariş Talebi",
        detailTitle: "Sipariş talep formu",
        description: "Sepete eklediğiniz ürünleri miktar, teslim beklentisi ve pazarlık notları ile sipariş talebine dönüştürün.",
        entityType: "ORDER",
        icon: PackageSearch,
    },
    CUSTOMER_DOCUMENT_REQUEST: {
        label: "Doküman Talebi",
        detailTitle: "Dokuman talep formu",
        description: "Teknik cizim, sertifika, katalog veya 3D model gibi dokumanlari urun baglamiyla birlikte talep edin.",
        entityType: "DOCUMENT",
        icon: FileBadge2,
    },
    CUSTOMER_PRICING_REQUEST: {
        label: "Fiyat Talebi",
        detailTitle: "Fiyat revizyon talebi formu",
        description: "Sepetteki varyantlar icin guncel teklif, hedef fiyat ve ticari degerlendirme notu gonderin.",
        entityType: "PRODUCT_VARIANT",
        icon: BadgePercent,
    },
}
