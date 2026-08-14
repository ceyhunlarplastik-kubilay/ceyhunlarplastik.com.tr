import type { ProductVariantCampaign } from "@/features/sales/campaigns/api/types"
import { resolveItemDiscountPercent } from "@/features/sales/campaigns/lib/campaignDiscount"

/**
 * Portal listesi VARYANT seviyesindedir ("Kampanyalı Ürün Varyantları"), oysa
 * uç kampanya seviyesinde döner. Burada kampanyalar kalemlerine açılır ve her
 * kalem için etkin indirim oranı çözülür.
 *
 * Aynı varyant birden çok kampanyada olabilir; her biri ayrı satır olarak kalır
 * (anahtar kampanya + varyant), çünkü müşteri hangi kampanyadan geldiğini
 * görmeli.
 */
export type CampaignVariantEntry = {
    key: string
    campaignId: string
    campaignTitle: string
    campaignDescription: string | null
    validFrom: string | null
    validUntil: string | null
    productVariantId: string
    discountPercent: number | null
    item: NonNullable<ProductVariantCampaign["items"]>[number]
    /** Müşterinin favori/tanımlı varyantlarıyla eşleşiyor mu. */
    isRelevant: boolean
}

export function flattenCampaignVariants(
    campaigns: ProductVariantCampaign[],
    relevantVariantIds: ReadonlySet<string>,
): CampaignVariantEntry[] {
    const entries: CampaignVariantEntry[] = []

    for (const campaign of campaigns) {
        for (const item of campaign.items ?? []) {
            entries.push({
                key: `${campaign.id}:${item.productVariantId}`,
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                campaignDescription: campaign.description ?? null,
                validFrom: campaign.validFrom ?? null,
                validUntil: campaign.validUntil ?? null,
                productVariantId: item.productVariantId,
                discountPercent: resolveItemDiscountPercent(
                    campaign.discountPercent,
                    item.discountPercent,
                ),
                item,
                isRelevant: relevantVariantIds.has(item.productVariantId),
            })
        }
    }

    // En yüksek indirim önce; eşitlikte kampanya başlığı ile deterministik sıra.
    return entries.sort((a, b) => {
        const diff = (b.discountPercent ?? 0) - (a.discountPercent ?? 0)
        if (diff !== 0) return diff
        return a.campaignTitle.localeCompare(b.campaignTitle, "tr")
    })
}
