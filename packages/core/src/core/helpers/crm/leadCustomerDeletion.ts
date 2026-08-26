/**
 * Potansiyel müşteri (LEAD) silmesini engelleyen kullanımlar.
 *
 * ## Neden engel uygulama katmanında
 * Şemadaki silme davranışları üç gruba ayrılıyor:
 *
 * | Davranış | İlişkiler |
 * |---|---|
 * | **Restrict** | `Order` — DB zaten engeller |
 * | **SetNull** | `User` (portal kullanıcısı), `BusinessRequest` |
 * | **Cascade** | adres, ziyaret, özel fiyat, atanmış/öne çıkan ürün, firma kontak ataması, nitelik ataması, kampanya alıcısı, davet |
 *
 * Tehlikeli olan **SetNull**: DB silmeyi ENGELLEMEZ, bağ sessizce kopar —
 * portal kullanıcısı sahipsiz kalır, iş talebi kimin olduğu bilinmez hâle gelir.
 * Bu yüzden engel burada kurulur. (Aynı sınıf sorun varyant silmede de vardı;
 * bkz. productVariants/variantDeletionBlockers.ts.)
 *
 * Cascade olanlar bilinçli olarak engel DEĞİL: bir potansiyel müşteriyi silmek
 * zaten adreslerini ve nitelik atamalarını silmek demektir.
 */

export type LeadCustomerUsageCounts = {
    orders: number
    portalUsers: number
    businessRequests: number
}

/** Prisma `_count` seçimi — tekil ve toplu silme aynı alanları saysın diye tek yerde. */
export const LEAD_CUSTOMER_DELETION_COUNT_SELECT = {
    orders: true,
    portalUsers: true,
    businessRequests: true,
} as const

const LABELS: Array<[keyof LeadCustomerUsageCounts, string]> = [
    ["orders", "sipariş"],
    ["portalUsers", "portal kullanıcısı"],
    ["businessRequests", "iş talebi"],
]

/** Boş dizi = silinebilir. */
export function describeLeadCustomerDeletionBlockers(
    counts: LeadCustomerUsageCounts,
): string[] {
    return LABELS.flatMap(([key, label]) => {
        const count = counts[key]
        return count > 0 ? [`${count} ${label}`] : []
    })
}

export type LeadCustomerDeletionCandidate = {
    id: string
    name: string
    /** LEAD olmayan kayıt bu yüzeyden SİLİNEMEZ (bkz. leadCustomers.ts sert kuralı). */
    isLead: boolean
    counts: LeadCustomerUsageCounts
}

export type LeadCustomerDeletionPlan = {
    deletableIds: string[]
    blocked: Array<{ id: string; name: string; reason: string }>
}

/**
 * Silinebilirleri ve engellileri ayırır.
 *
 * Engelli kayıt tüm işlemi düşürmez: silinebilenler silinir, engelliler adıyla
 * bildirilir ve arayüzde seçili kalır (varyant toplu silmesiyle aynı karar).
 */
export function planLeadCustomerDeletion(
    candidates: readonly LeadCustomerDeletionCandidate[],
): LeadCustomerDeletionPlan {
    const deletableIds: string[] = []
    const blocked: LeadCustomerDeletionPlan["blocked"] = []

    for (const candidate of candidates) {
        if (!candidate.isLead) {
            blocked.push({
                id: candidate.id,
                name: candidate.name,
                reason: "cari müşteriye dönüştürülmüş",
            })
            continue
        }

        const blockers = describeLeadCustomerDeletionBlockers(candidate.counts)
        if (blockers.length === 0) {
            deletableIds.push(candidate.id)
        } else {
            blocked.push({
                id: candidate.id,
                name: candidate.name,
                reason: blockers.join(", "),
            })
        }
    }

    return { deletableIds, blocked }
}
