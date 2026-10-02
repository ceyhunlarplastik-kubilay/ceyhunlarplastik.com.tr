import type { AuditSnapshot, AuditValue } from "@/core/helpers/audit/types"
import { CUSTOMER_ATTRIBUTE_CODES } from "@/core/helpers/crm/customerAttributes"
import { GOOGLE_PLACES_PROVIDER } from "@/core/helpers/crm/customerAddressInput"
import { buildUserDisplayName } from "@/core/helpers/users/displayName"
import type { Prisma } from "@/prisma/generated/prisma/client"

/**
 * Müşterinin denetlenen hâlini okumak için gereken ilişkiler — `toCustomerAuditSnapshot`
 * ile birlikte değişir. Referanslar ADIYLA okunur: kayıt, referans verilen kişi / değer
 * sonradan silinse ya da yeniden adlandırılsa da o anki hâliyle okunur kalsın (Category'de
 * id saklamak, silinen değerde okunamayan kayıt üretmişti).
 */
export const customerAuditInclude = {
    additionalPhones: {
        select: { number: true, label: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    },
    addresses: {
        select: {
            label: true,
            contactName: true,
            phone: true,
            email: true,
            line1: true,
            line2: true,
            district: true,
            city: true,
            country: true,
            postalCode: true,
            taxOffice: true,
            taxNumber: true,
            note: true,
            isPrimary: true,
            isBilling: true,
            isShipping: true,
            latitude: true,
            longitude: true,
            geocodingProvider: true,
            locationVerifiedAt: true,
            stateRef: { select: { name: true } },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    },
    assignedSalesUser: {
        select: { firstName: true, lastName: true, identifier: true, email: true },
    },
    sectorValue: { select: { name: true } },
    productionGroupValue: { select: { name: true } },
    usageAreaValues: { select: { name: true } },
    attributeValueAssignments: {
        select: {
            attributeValue: {
                select: {
                    name: true,
                    attribute: { select: { code: true, name: true } },
                },
            },
        },
    },
    companyContactAssignments: {
        select: {
            isActive: true,
            companyContact: { select: { name: true, department: true } },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    },
} satisfies Prisma.CustomerInclude

export type CustomerAuditRow = Prisma.CustomerGetPayload<{ include: typeof customerAuditInclude }>

type DecimalLike = { toString(): string } | null

const HIERARCHY_ATTRIBUTE_CODES = new Set<string>(Object.values(CUSTOMER_ATTRIBUTE_CODES))

/** Adres bayrakları tek liste alanında: "Birincil: Hayır, Fatura: Hayır…" gürültüsü olmasın. */
export const CUSTOMER_ADDRESS_ROLE_CODES = ["PRIMARY", "BILLING", "SHIPPING"] as const

/** Boş metin ile `null` aynı şeydir: "" → null geçişi değişiklik sayılmasın. */
const text = (value: string | null | undefined): string | null => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

const decimalText = (value: DecimalLike): string | null => (value === null ? null : value.toString())

const list = (values: Array<string | null | undefined>, { sort = true } = {}): string[] => {
    const cleaned = values.map((value) => text(value)).filter((value): value is string => value !== null)
    return sort ? cleaned.sort((left, right) => left.localeCompare(right, "tr")) : cleaned
}

/** "Ad Soyad (e-posta)" — ad yoksa yalnız e-posta (e-postanın ön ekini ad gibi göstermez). */
export function customerAuditUserLabel(user: {
    firstName?: string | null
    lastName?: string | null
    identifier?: string | null
    email?: string | null
} | null): string | null {
    if (!user) return null
    const name = text(buildUserDisplayName({ firstName: user.firstName, lastName: user.lastName, identifier: user.identifier }))
    const email = text(user.email)
    if (name && email && name !== email) return `${name} (${email})`
    return name ?? email
}

type AuditAddress = CustomerAuditRow["addresses"][number]

/**
 * Konum yalnız ELLE işaretlenmişse kayda girer. Google kaynaklı adreste koordinat bir
 * ÖNBELLEKTİR: günlük cron onu yeniler / temizler (Google koşulları); kayda girseydi her
 * gün yüzlerce sahte değişiklik üretirdi. Google adresinde kullanıcının seçimi açık adres
 * alanlarında zaten görünür.
 */
function manualLocation(address: AuditAddress): string | null {
    if (address.geocodingProvider === GOOGLE_PLACES_PROVIDER) return null
    if (address.latitude === null || address.longitude === null) return null
    return `${Number(address.latitude).toFixed(6)}, ${Number(address.longitude).toFixed(6)}`
}

function addressRoles(address: AuditAddress): string[] {
    return [
        address.isPrimary ? "PRIMARY" : null,
        address.isBilling ? "BILLING" : null,
        address.isShipping ? "SHIPPING" : null,
    ].filter((role): role is (typeof CUSTOMER_ADDRESS_ROLE_CODES)[number] => role !== null)
}

function addressFields(address: AuditAddress): Record<string, AuditValue> {
    return {
        line1: text(address.line1),
        line2: text(address.line2),
        district: text(address.district),
        city: text(address.city),
        state: text(address.stateRef?.name),
        country: text(address.country),
        postalCode: text(address.postalCode),
        contactName: text(address.contactName),
        phone: text(address.phone),
        email: text(address.email),
        taxOffice: text(address.taxOffice),
        taxNumber: text(address.taxNumber),
        roles: addressRoles(address),
        location: manualLocation(address),
        locationVerified: address.locationVerifiedAt ? true : null,
        note: text(address.note),
    }
}

/**
 * Müşterinin denetlenen hâli — alan yolu → değer. Bu bir İZİN LİSTESİDİR: burada olmayan
 * alan kayda girmez. Yeni bir alan izlenecekse buraya ve arayüzdeki etiket listesine
 * (`customerAuditPresentation.ts`) eklenir.
 *
 * - Adresler ETİKETLE anahtarlanır (`addresses.<etiket>.<alan>`): iş talebi onayı ve tam
 *   güncelleme adresleri silip yeniden yazdığı için id'ler değişir; etiketle anahtarlayınca
 *   içeriği aynı kalan adres sahte "silindi + eklendi" üretmez. Aynı etiket iki kez varsa
 *   ikincisi "(2)" ile ayrılır.
 * - Sektör / üretim grubu / kullanım alanı `attributeValueAssignments`'ta DA tutuluyor;
 *   `profileAttributes` bu hiyerarşiyi tekrar etmez, yalnız diğer profil değerlerini taşır.
 * - Kişisel veriler (telefon, e-posta, vergi no) DEĞERLERİYLE girer (kullanıcı kararı,
 *   2026-10-01): kaydı yalnız admin / owner okur; saklama ve anonimleştirme PLAN'da.
 * - Koordinat önbelleği, sıralama (`displayOrder`), geocoding ham verisi ve `convertedAt`
 *   girmez: kullanıcının yaptığı bir değişiklik değiller ya da aktör zaten kayıtta.
 */
export function toCustomerAuditSnapshot(row: CustomerAuditRow): AuditSnapshot {
    const snapshot: AuditSnapshot = {
        companyName: text(row.companyName),
        fullName: text(row.fullName),
        phone: text(row.phone),
        email: text(row.email),
        websiteUrl: text(row.websiteUrl),
        note: text(row.note),
        status: row.status,
        generalDiscountPercent: decimalText(row.generalDiscountPercent),
        defaultPaymentTermDays: row.defaultPaymentTermDays,
        creditLimit: decimalText(row.creditLimit),
        paymentTermNote: text(row.paymentTermNote),
        assignedSalesUser: customerAuditUserLabel(row.assignedSalesUser),
        sector: text(row.sectorValue?.name),
        productionGroup: text(row.productionGroupValue?.name),
        usageAreas: list(row.usageAreaValues.map((value) => value.name)),
        profileAttributes: list(
            row.attributeValueAssignments
                .filter((assignment) => !HIERARCHY_ATTRIBUTE_CODES.has(assignment.attributeValue.attribute.code))
                .map((assignment) =>
                    `${assignment.attributeValue.attribute.name}: ${assignment.attributeValue.name}`,
                ),
        ),
        additionalPhones: list(
            row.additionalPhones.map((phone) => (text(phone.label) ? `${phone.number} (${phone.label!.trim()})` : phone.number)),
            { sort: false },
        ),
        companyContacts: list(
            row.companyContactAssignments.map((assignment) => {
                const contact = `${assignment.companyContact.name} · ${assignment.companyContact.department}`
                return assignment.isActive ? contact : `${contact} (pasif)`
            }),
            { sort: false },
        ),
    }

    const seenLabels = new Map<string, number>()
    for (const address of row.addresses) {
        const baseLabel = text(address.label) ?? "Adres"
        const occurrence = (seenLabels.get(baseLabel) ?? 0) + 1
        seenLabels.set(baseLabel, occurrence)
        const key = occurrence === 1 ? baseLabel : `${baseLabel} (${occurrence})`

        for (const [field, value] of Object.entries(addressFields(address))) {
            snapshot[`addresses.${key}.${field}`] = value
        }
    }

    return snapshot
}

/** Denetim listesinde müşteriyi tanıtan ad; silinen kayıt için de okunur kalır. */
export function customerAuditLabel(row: { companyName: string | null; fullName: string | null; phone: string }) {
    return text(row.companyName) ?? text(row.fullName) ?? row.phone
}
