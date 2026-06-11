import type { BusinessRequest } from "@/features/businessRequests/api/types"
import {
    formatDateValue,
    getDocumentTypeLabel,
    renderDataValue,
} from "@/features/businessRequests/lib/businessRequestFormatting"

export type BusinessRequestDataEntry = {
    label: string
    value: string
}

export function getRequestDataHighlights(request: BusinessRequest): BusinessRequestDataEntry[] {
    const data = request.requestedData ?? {}

    switch (request.type) {
        case "CUSTOMER_PROFILE_CHANGE": {
            const profile = data.proposedProfile as Record<string, unknown> | undefined
            const addresses = Array.isArray(profile?.addresses) ? profile.addresses : []

            return [
                { label: "Firma", value: renderDataValue(profile?.companyName) },
                { label: "Yetkili", value: renderDataValue(profile?.fullName) },
                { label: "Telefon", value: renderDataValue(profile?.phone) },
                { label: "E-posta", value: renderDataValue(profile?.email) },
                { label: "Adres Talebi", value: addresses.length > 0 ? `${addresses.length} kayıt` : "-" },
            ]
        }
        case "CUSTOMER_ORDER_REQUEST":
            return [
                { label: "Teslim Tarihi", value: formatDateValue(data.requestedDeliveryDate) },
                { label: "Sevkiyat Adresi", value: renderDataValue(data.shippingAddressLabel) },
                { label: "Müşteri Referansı", value: renderDataValue(data.referenceCode) },
                { label: "Kalem", value: renderDataValue(data.draftItemCount) },
                { label: "Toplam Adet", value: renderDataValue(data.draftQuantity) },
            ]
        case "CUSTOMER_DOCUMENT_REQUEST":
            return [
                {
                    label: "Döküman Tipleri",
                    value: Array.isArray(data.documentTypes)
                        ? data.documentTypes.map((item) => getDocumentTypeLabel(String(item))).join(", ")
                        : "-",
                },
                { label: "Format", value: renderDataValue(data.documentFormat) },
                { label: "Ürün Referansı", value: renderDataValue(data.productReference) },
                { label: "Varyant Referansı", value: renderDataValue(data.variantReference) },
                { label: "İhtiyaç Tarihi", value: formatDateValue(data.neededAt) },
            ]
        case "CUSTOMER_PRICING_REQUEST":
            return [
                { label: "Teklif Tarihi", value: formatDateValue(data.quoteNeededAt) },
                { label: "Talep Nedeni", value: renderDataValue(data.pricingReason) },
                { label: "Ticari Beklenti", value: renderDataValue(data.pricingExpectation) },
                { label: "Müşteri Referansı", value: renderDataValue(data.referenceCode) },
                { label: "Kalem", value: renderDataValue(data.draftItemCount) },
            ]
        default:
            return Object.entries(data).map(([key, value]) => ({
                label: key,
                value: renderDataValue(value),
            }))
    }
}

export function getRequestDataNotes(request: BusinessRequest): BusinessRequestDataEntry[] {
    const data = request.requestedData ?? {}
    const notes: BusinessRequestDataEntry[] = []

    if (typeof data.commercialNote === "string" && data.commercialNote.trim()) {
        notes.push({ label: "Ticari Not", value: data.commercialNote })
    }

    if (typeof data.negotiationNote === "string" && data.negotiationNote.trim()) {
        notes.push({ label: "Pazarlık Notu", value: data.negotiationNote })
    }

    const latestCounterOffer = typeof data.latestCounterOffer === "object" && data.latestCounterOffer
        ? data.latestCounterOffer as Record<string, unknown>
        : null
    if (typeof latestCounterOffer?.note === "string" && latestCounterOffer.note.trim()) {
        notes.push({ label: "Karşı Teklif Notu", value: latestCounterOffer.note })
    }

    if (typeof data.documentPurpose === "string" && data.documentPurpose.trim()) {
        notes.push({ label: "Talep Amacı", value: data.documentPurpose })
    }

    if (request.type === "CUSTOMER_PROFILE_CHANGE") {
        const profile = data.proposedProfile as Record<string, unknown> | undefined
        if (typeof profile?.note === "string" && profile.note.trim()) {
            notes.push({ label: "Profil Notu", value: profile.note })
        }
    }

    return notes
}
