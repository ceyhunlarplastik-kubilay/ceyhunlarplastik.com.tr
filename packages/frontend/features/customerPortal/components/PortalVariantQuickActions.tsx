"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SiWhatsapp } from "react-icons/si"
import { BadgePercent, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type {
    VariantMeasurement,
    VariantTableData,
} from "@/features/public/products/components/ProductVariantTable"
import { usePortalSpecialPrices } from "@/features/customerPortal/hooks/usePortalSpecialPrices"
import { usePortalCampaigns } from "@/features/customerPortal/hooks/usePortalCampaigns"
import { flattenCampaignVariants } from "@/features/customerPortal/lib/campaignRelevance"
import { useCartDrawerStore } from "@/features/customerPortal/stores/useCartDrawerStore"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import {
    CustomerPortalSpecialPriceRequestDialog,
    type CustomerSpecialPriceRequestInitialSelection,
} from "@/features/customerPortal/specialPrices/components/CustomerPortalSpecialPriceRequestDialog"
import {
    buildCompactMaterialSummary,
    buildCompactMeasurementSummary,
    buildWhatsappPriceRequestUrl,
    resolvePortalPricing,
} from "@/features/customerPortal/pricing/portalVariantRowPricing"

type Props = {
    variant: VariantTableData
    productId: string
    productSlug: string
    productName: string
    productCode: string
    productCategoryId?: string | null
    categoryName?: string
    customerDiscountPercent?: number | null
    selectedMeasurements: VariantMeasurement[]
    productImageUrl?: string | null
}

/**
 * `/varyantlar` sayfasındaki (`CustomerPortalVariantDetailsTable`) 3 aksiyon
 * butonunun (Sepete Ekle / Özel Fiyat Talep Et / Hızlı Fiyat Al) kompakt,
 * ikon-only karşılığı — ürün sayfasındaki "Mevcut Varyant Kodları" panelinde
 * satır başına az yer kaplaması için. Fiyat/kampanya/özel fiyat hesabı AYNI
 * paylaşılan yardımcıları (`portalVariantRowPricing`) kullanır, tekrar YOK.
 * Miktar girişi yok (kompakt kalsın diye) — varsayılan 1 adet eklenir, adet
 * sepet çekmecesinden ayarlanabilir.
 */
export function PortalVariantQuickActions({
    variant,
    productId,
    productSlug,
    productName,
    productCode,
    productCategoryId,
    categoryName,
    customerDiscountPercent,
    selectedMeasurements,
    productImageUrl,
}: Props) {
    const addItem = usePortalRequestDraftStore((state) => state.addItem)
    const draftItems = usePortalRequestDraftStore((state) => state.items)
    const openCartDrawer = useCartDrawerStore((state) => state.open)
    const specialPricesQuery = usePortalSpecialPrices()
    const campaignsQuery = usePortalCampaigns()
    const [specialPriceRequestOpen, setSpecialPriceRequestOpen] = useState(false)

    const specialPrice = useMemo(
        () => (specialPricesQuery.data?.data ?? []).find((item) => item.productVariantId === variant.id),
        [specialPricesQuery.data?.data, variant.id],
    )
    const campaignDiscountPercent = useMemo(() => {
        let best: number | null = null
        for (const entry of flattenCampaignVariants(campaignsQuery.data ?? [], new Set())) {
            if (entry.productVariantId !== variant.id || entry.discountPercent === null) continue
            if (best === null || entry.discountPercent > best) best = entry.discountPercent
        }
        return best
    }, [campaignsQuery.data, variant.id])
    const existingDraftQuantity = draftItems.find((item) => item.variantId === variant.id)?.quantity ?? 0

    const initialSelection: CustomerSpecialPriceRequestInitialSelection = {
        categoryId: productCategoryId ?? null,
        productId,
        productName,
        productCode,
        productVariantId: variant.id,
        variantFullCode: variant.fullCode,
        variantName: variant.name,
    }

    function handleAddToDraft() {
        const pricing = resolvePortalPricing({
            variant,
            quantity: existingDraftQuantity + 1,
            customerDiscountPercent,
            campaignDiscountPercent,
            specialPrice,
        })
        addItem({
            productId,
            productSlug,
            productName,
            productCode,
            productImageUrl,
            variantId: variant.id,
            variantName: variant.name,
            variantKey: selectedMeasurements.map((measurement) => `${measurement.measurementType.code}:${measurement.rawValue ?? measurement.value}`).join("|"),
            variantFullCode: variant.fullCode,
            measurementSummary: buildCompactMeasurementSummary(variant) || null,
            colorName: variant.color?.name ?? null,
            colorHex: variant.color?.hex ?? null,
            materialSummary: buildCompactMaterialSummary(variant) || null,
            quantity: 1,
            listUnitPrice: pricing.listUnitPrice,
            customerUnitPrice: pricing.customerUnitPrice,
            appliedDiscountPercent: pricing.appliedDiscountPercent,
            generalDiscountPercent: customerDiscountPercent ?? null,
            priceSource: pricing.priceSource,
            specialPriceId: pricing.specialPriceId,
            specialPricePreview: pricing.specialPricePreview,
            specialPriceEligible: pricing.specialPriceEligible,
            specialPriceIneligibilityReason: pricing.specialPriceIneligibilityReason,
            specialPriceIneligibilityMessage: pricing.specialPriceIneligibilityMessage,
            pricingSnapshot: pricing.pricingSnapshot,
            currency: pricing.currency,
            targetUnitPrice: null,
            customerNote: "",
        })
        if (pricing.specialPriceIneligibilityMessage) {
            toast.warning(pricing.specialPriceIneligibilityMessage)
        }
        if (pricing.priceSource === "CUSTOMER_SPECIAL_PRICE") {
            toast.success("Özel fiyat koşulu sağlandı ve sepete uygulandı.")
        } else {
            toast.success("Varyant talep taslağına eklendi.")
        }
        openCartDrawer()
    }

    function handleWhatsappPriceRequest() {
        const whatsappUrl = buildWhatsappPriceRequestUrl({
            variant,
            productName,
            productCode,
            categoryName,
            selectedMeasurements,
            currentUrl: window.location.href,
        })
        window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    }

    return (
        <TooltipProvider>
            <div className="flex items-center justify-end gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon-xs"
                            className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
                            onClick={handleAddToDraft}
                            aria-label="Sepete Ekle"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sepete Ekle</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            className="rounded-full border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100"
                            onClick={() => setSpecialPriceRequestOpen(true)}
                            aria-label="Özel Fiyat Talep Et"
                        >
                            <BadgePercent className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Özel Fiyat Talep Et</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon-xs"
                            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={handleWhatsappPriceRequest}
                            aria-label="WhatsApp üzerinden hızlı fiyat al"
                        >
                            <SiWhatsapp className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hızlı Fiyat Al</TooltipContent>
                </Tooltip>
            </div>
            {specialPriceRequestOpen ? (
                <CustomerPortalSpecialPriceRequestDialog
                    open={specialPriceRequestOpen}
                    onOpenChange={setSpecialPriceRequestOpen}
                    initialSelection={initialSelection}
                />
            ) : null}
        </TooltipProvider>
    )
}
