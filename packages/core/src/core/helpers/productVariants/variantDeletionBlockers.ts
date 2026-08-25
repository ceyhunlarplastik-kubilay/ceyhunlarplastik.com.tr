/**
 * Bir varyantın silinmesini engelleyen kullanımlar.
 *
 * Varyant silinince kodu serbest kalır ve ölçüler yeniden numaralanabilir; ama
 * varyant bir siparişte veya teklifte geçiyorsa o kayıt geçmişe aittir ve
 * silinmemelidir. `OrderItem`/`BusinessRequestItem` şemada `SetNull` olduğu için
 * DB silmeyi ENGELLEMEZ — bağ sessizce kopar ve sipariş hangi ürüne aitti
 * bilinemez hâle gelir. Bu yüzden engel uygulama katmanında kurulur.
 */

export type VariantUsageCounts = {
    orderItems: number
    requestItems: number
    customerSpecialPrices: number
    campaignItems: number
    assignedToCustomers: number
}

/** Prisma `_count` seçimi — tekil ve toplu silme aynı alanları saysın diye tek yerde. */
export const VARIANT_DELETION_COUNT_SELECT = {
    orderItems: true,
    requestItems: true,
    customerSpecialPrices: true,
    campaignItems: true,
    assignedToCustomers: true,
} as const

const LABELS: Array<[keyof VariantUsageCounts, string]> = [
    ["orderItems", "sipariş kalemi"],
    ["requestItems", "iş talebi kalemi"],
    ["customerSpecialPrices", "özel fiyat"],
    ["campaignItems", "kampanya kalemi"],
    ["assignedToCustomers", "müşteri ataması"],
]

/** Boş dizi = silinebilir. */
export function describeVariantDeletionBlockers(counts: VariantUsageCounts): string[] {
    return LABELS.flatMap(([key, label]) => {
        const count = counts[key]
        return count > 0 ? [`${count} ${label}`] : []
    })
}

export type VariantDeletionCandidate = {
    id: string
    fullCode: string
    counts: VariantUsageCounts
}

export type VariantDeletionPlan = {
    deletableIds: string[]
    blocked: Array<{ id: string; fullCode: string; reason: string }>
}

/**
 * Silinebilirleri ve engellileri ayırır — TOPLU silmenin saf planı.
 *
 * Kullanıcı kararı (2026-08-25): engelli satır tüm işlemi düşürmez. Gmail'deki
 * gibi silinebilenler silinir, engelliler adıyla bildirilir ve seçili kalır;
 * kalabalık bir seçimde tek bir sipariş kaydı yüzünden 19 satırı yeniden
 * seçmek zorunda kalınmaz.
 */
export function planVariantDeletion(
    candidates: readonly VariantDeletionCandidate[],
): VariantDeletionPlan {
    const deletableIds: string[] = []
    const blocked: VariantDeletionPlan["blocked"] = []

    for (const candidate of candidates) {
        const blockers = describeVariantDeletionBlockers(candidate.counts)
        if (blockers.length === 0) {
            deletableIds.push(candidate.id)
        } else {
            blocked.push({
                id: candidate.id,
                fullCode: candidate.fullCode,
                reason: blockers.join(", "),
            })
        }
    }

    return { deletableIds, blocked }
}
