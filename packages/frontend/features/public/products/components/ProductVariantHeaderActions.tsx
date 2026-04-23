"use client"

import { ShoppingCart } from "lucide-react"
import { SiWhatsapp } from "react-icons/si"
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
    const addItem = useInquiryCartStore((state) => state.addItem)

    function handleWhatsappClick() {
        const currentUrl = window.location.href
        const message = `Merhaba. Ürününüz ile ilgili bilgi almak istiyorum.\nÜrün Adı: ${productName}\nÜrün Linki: ${currentUrl}`
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

        toast.success("Varyant talep sepetine eklendi.")
    }

    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
                type="button"
                onClick={handleWhatsappClick}
                aria-label="WhatsApp üzerinden hızlı fiyat al"
                className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
                <SiWhatsapp className="h-4 w-4" />
                Hızlı Fiyat Al
            </Button>

            <ButtonShine
                onClick={handleAddToCart}
                ariaLabel="Ürünü talep sepetine ekle"
                className="h-11 w-full gap-2"
            >
                <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Sepete Ekle
                </span>
            </ButtonShine>
        </div>
    )
}
