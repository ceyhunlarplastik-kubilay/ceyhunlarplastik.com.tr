import type { BusinessRequest } from "@/features/businessRequests/api/types"
import {
    formatDateValue,
    formatMoneyValue,
    getDocumentTypeLabel,
    renderDataValue,
} from "@/features/businessRequests/lib/businessRequestFormatting"

export type BusinessRequestDataEntry = {
    label: string
    value: string
}

function asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function formatSpecialPricePaymentTerm(specialPrice: Record<string, unknown>) {
    if (typeof specialPrice.paymentTermLabel === "string" && specialPrice.paymentTermLabel.trim()) {
        return specialPrice.paymentTermLabel
    }

    if (Array.isArray(specialPrice.paymentSchedule) && specialPrice.paymentSchedule.length > 0) {
        return specialPrice.paymentSchedule
            .map((step) => {
                const record = asRecord(step)
                const percentage = typeof record.percentage === "number"
                    ? `%${record.percentage.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`
                    : null
                const label = typeof record.label === "string" && record.label.trim()
                    ? record.label.trim()
                    : null

                return [percentage, label].filter(Boolean).join(" ")
            })
            .filter(Boolean)
            .join(" + ") || "-"
    }

    if (typeof specialPrice.paymentTermDays === "number") {
        return specialPrice.paymentTermDays === 0 ? "Peşin" : `${specialPrice.paymentTermDays} Gün`
    }

    return "Vade belirtilmedi"
}

function formatSpecialPriceValidity(specialPrice: Record<string, unknown>) {
    const from = formatDateValue(specialPrice.validFrom)
    const until = formatDateValue(specialPrice.validUntil)
    if (from === "-" && until === "-") return "Süresiz"
    if (from !== "-" && until !== "-") return `${from} - ${until}`
    if (from !== "-") return `${from} sonrası`
    return `${until} tarihine kadar`
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
            if (data.requestKind === "CUSTOMER_SPECIAL_PRICE_REQUEST") {
                const specialPrice = asRecord(data.specialPrice)
                const productSnapshot = asRecord(data.productSnapshot)
                const variantSnapshot = asRecord(data.variantSnapshot)
                const currency = typeof specialPrice.currency === "string" ? specialPrice.currency : "TRY"
                const productLabel = [
                    typeof productSnapshot.code === "string" ? productSnapshot.code : null,
                    typeof productSnapshot.name === "string" ? productSnapshot.name : null,
                ].filter(Boolean).join(" - ")
                const variantLabel = [
                    typeof variantSnapshot.fullCode === "string" ? variantSnapshot.fullCode : null,
                    typeof variantSnapshot.measurementSummary === "string" ? variantSnapshot.measurementSummary : null,
                ].filter(Boolean).join(" · ")

                return [
                    { label: "Ürün Modeli", value: productLabel || "-" },
                    { label: "Varyant", value: variantLabel || "-" },
                    { label: "Talep Edilen Fiyat", value: formatMoneyValue(specialPrice.price, currency) },
                    { label: "Vade", value: formatSpecialPricePaymentTerm(specialPrice) },
                    { label: "Geçerlilik", value: formatSpecialPriceValidity(specialPrice) },
                ]
            }

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

    if (request.type === "CUSTOMER_PRICING_REQUEST" && data.requestKind === "CUSTOMER_SPECIAL_PRICE_REQUEST") {
        const specialPrice = asRecord(data.specialPrice)
        if (typeof specialPrice.note === "string" && specialPrice.note.trim()) {
            notes.push({ label: "Talep Notu", value: specialPrice.note })
        }
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
