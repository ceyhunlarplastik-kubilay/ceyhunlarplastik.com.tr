import type { AuditLogEntry } from "@/features/admin/auditLogs/api/types"
import type { AuditPresenter } from "@/features/admin/auditLogs/utils/auditPresentation"
import { formatMoney } from "@/lib/customers/pricing"

/**
 * Müşteri denetim kayıtlarının sunumu. Alan yolları backend'deki `toCustomerAuditSnapshot`
 * (core/helpers/crm/customerAudit.ts) ile AYNI olmalı: orada yeni bir alan denetlenmeye
 * başlarsa etiketi buraya eklenir, yoksa ham yol görünür. Etiketler müşteri / adres
 * formlarındaki adlardır. Referanslar (temsilci, sektör, iletişim kişisi) kayıtta zaten
 * ADIYLA durur; sözlük çözümü gerekmez.
 */
const FIELD_LABELS: Record<string, string> = {
    companyName: "Firma adı",
    fullName: "Yetkili kişi",
    phone: "Telefon",
    email: "E-posta",
    websiteUrl: "Web sitesi",
    note: "Not",
    status: "Durum",
    generalDiscountPercent: "Genel iskonto",
    defaultPaymentTermDays: "Varsayılan vade",
    creditLimit: "Kredi limiti",
    paymentTermNote: "Ödeme şartı notu",
    assignedSalesUser: "Müşteri temsilcisi",
    sector: "Sektör",
    productionGroup: "Üretim grubu",
    usageAreas: "Kullanım alanları",
    profileAttributes: "Profil eşleşme alanları",
    additionalPhones: "Ek telefonlar",
    companyContacts: "Ceyhunlar iletişimleri",
}

/** Adres formundaki adlar: bu projede `city` İLÇE, `district` mahalle / bölgedir. */
const ADDRESS_FIELD_LABELS: Record<string, string> = {
    line1: "Açık adres",
    line2: "Ek adres bilgisi",
    district: "Mahalle / bölge",
    city: "İlçe",
    state: "İl",
    country: "Ülke",
    postalCode: "Posta kodu",
    contactName: "İrtibat kişisi",
    phone: "Telefon",
    email: "E-posta",
    taxOffice: "Vergi dairesi",
    taxNumber: "Vergi no",
    roles: "Adres türü",
    location: "Konum (elle işaretlenen)",
    locationVerified: "Konum doğrulandı",
    note: "Not",
}

const ADDRESS_ROLE_LABELS: Record<string, string> = {
    PRIMARY: "Birincil",
    BILLING: "Fatura",
    SHIPPING: "Sevkiyat",
}

const STATUS_LABELS: Record<string, string> = {
    LEAD: "Potansiyel",
    CUSTOMER: "Müşteri",
}

/**
 * `addresses.<etiket>.<alan>` — etiket nokta içerebilir ("Depo No.2"); alan adı sabit
 * listeden geldiği için SON noktadan bölünür.
 */
const ADDRESS_FIELD = /^addresses\.(.+)\.([A-Za-z0-9]+)$/

function parseAddressField(field: string): { label: string; part: string } | null {
    const match = ADDRESS_FIELD.exec(field)
    return match ? { label: match[1], part: match[2] } : null
}

export function customerAuditFieldLabel(field: string): string {
    const known = FIELD_LABELS[field]
    if (known) return known

    const address = parseAddressField(field)
    if (address) return `Adres (${address.label}) · ${ADDRESS_FIELD_LABELS[address.part] ?? address.part}`

    return field
}

const percentFormatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 })

export function customerAuditValueLabel(field: string, value: string): string {
    switch (field) {
        case "status":
            return STATUS_LABELS[value] ?? value
        case "generalDiscountPercent": {
            const percent = Number(value)
            return Number.isFinite(percent) ? `%${percentFormatter.format(percent)}` : value
        }
        case "creditLimit": {
            const amount = Number(value)
            return Number.isFinite(amount) ? formatMoney(amount) : value
        }
        case "defaultPaymentTermDays":
            return `${value} gün`
        default:
            return value
    }
}

export function customerAuditItemLabel(field: string, item: string): string {
    if (parseAddressField(field)?.part === "roles") return ADDRESS_ROLE_LABELS[item] ?? item
    return item
}

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}

const count = (value: unknown) => (typeof value === "number" ? value : 0)

export function customerAuditMetadataLines(entry: AuditLogEntry): string[] {
    const metadata = asRecord(entry.metadata)
    const lines: string[] = []

    if (entry.action === "DELETE" && metadata.cascade) {
        const cascade = asRecord(metadata.cascade)
        const parts = [
            [count(cascade.visitCount), "ziyaret"],
            [count(cascade.assignedProductCount), "tanımlı varyant"],
            [count(cascade.specialPriceCount), "özel fiyat"],
        ] as const
        const removed = parts.filter(([amount]) => amount > 0).map(([amount, label]) => `${amount} ${label}`)

        if (removed.length > 0) lines.push(`Kayıtla birlikte silinen: ${removed.join(", ")}`)
    }

    if (typeof metadata.businessRequestId === "string") {
        lines.push("Müşteri profil değişikliği talebinin onayıyla uygulandı")
    }

    if (typeof metadata.invitationId === "string") {
        lines.push("Portal davetinin kabul edilmesiyle cari müşteriye dönüştü")
    }

    return lines
}

export const customerAuditPresenter: AuditPresenter = {
    fieldLabel: customerAuditFieldLabel,
    itemLabel: customerAuditItemLabel,
    valueLabel: customerAuditValueLabel,
    metadataLines: customerAuditMetadataLines,
}
