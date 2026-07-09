"use client"

import { ShoppingCart } from "lucide-react"
import { SiWhatsapp } from "react-icons/si"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ButtonShine } from "@/components/ui/button-shine"
import { useInquiryCartStore } from "@/features/public/cart/store/useInquiryCartStore"

type Props = {
    productId: string
    productSlug: string
    productName: string
    productCode: string
    variantKey: string
    variantId?: string
    variantFullCode?: string | null
}

const WHATSAPP_PHONE = "905530602946"

export default function ProductVariantHeaderActions({
    productId,
    productSlug,
    productName,
    productCode,
    variantKey,
    variantId,
    variantFullCode,
}: Props) {
    const t = useTranslations("public.productVariant.actions")
    const addItem = useInquiryCartStore((state) => state.addItem)

    function handleWhatsappClick() {
        const currentUrl = window.location.href
        const message = t("whatsappMessage", { name: productName, url: currentUrl })
        const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    }

    function handleAddToCart() {
        addItem({
            productId,
            productSlug,
            productName,
            productCode,
            variantKey,
            variantId,
            variantFullCode,
            quantity: 1,
        })

        toast.success(t("addedToCart"))
    }

    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
                type="button"
                onClick={handleWhatsappClick}
                aria-label={t("whatsappAria")}
                className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
                <SiWhatsapp className="h-4 w-4" />
                {t("whatsapp")}
            </Button>

            <ButtonShine
                onClick={handleAddToCart}
                ariaLabel={t("addToCartAria")}
                className="h-11 w-full gap-2"
            >
                <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {t("addToCart")}
                </span>
            </ButtonShine>
        </div>
    )
}
