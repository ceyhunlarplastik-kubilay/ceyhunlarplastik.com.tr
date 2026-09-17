"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ImageIcon, Loader2, PackageSearch, Sparkles, SquareArrowOutUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CustomerProfileMatchedProduct } from "@/features/crm/types"

type Props = {
    hasProfile: boolean
    matchedProductCount: number
    matchedProducts: CustomerProfileMatchedProduct[]
    isLoading?: boolean
    /** "Profil atanmamış" durumunun açıklaması — yüzeye göre değişir. */
    noProfileHint?: ReactNode
    /** "Eşleşme bulunamadı" durumundaki alt açıklama — yüzeye göre değişir. */
    noMatchHint?: ReactNode
    /**
     * Verilirse eşleşen ürün varken başlık satırına "Tümünü Gör" linki eklenir —
     * çağıran taraf, müşterinin sektör/üretim grubu/kullanım alanı slug'larıyla
     * kendi panelinin ürünler sayfasına giden filtreli URL'i kurar (bkz.
     * `ProductAssistantModal.goToFilter` ile aynı query şeması: `sector`,
     * `production_group`, `usage_area`).
     */
    viewAllHref?: string
}

const DEFAULT_NO_PROFILE_HINT = (
    <>
        Bu müşteriye henüz endüstriyel profil atanmamış. Sektör veya kullanım alanı seçilene kadar
        müşteri portalında &quot;İlgili Ürünler&quot; boş görünür.
    </>
)

const DEFAULT_NO_MATCH_HINT = (
    <>
        Seçilen kullanım alanlarına atanmış ürün yok. &quot;Kullanım Alanı Ürün Atamaları&quot; sekmesinden
        bu alanlara ürün atayabilirsiniz.
    </>
)

/**
 * Müşteri profilinin SONUCUNU gösterir: bu profille eşleşen ürünler. Müşteri
 * portalındaki "İlgili Ürünler" ile aynı kurallardan beslenir
 * (`buildCustomerProfileProductWhereClauses`), böylece operatör/temsilci yanlış
 * atamayı portala yansımadan görür.
 *
 * Reusable: veri girişi paneli (`LeadCustomerDetailPanel`) ve satış paneli
 * müşteri haritası accordion'u aynı bileşeni kullanır; ileride satış müdürü ve
 * admin panelleri de bağlanabilir.
 */
export function CustomerProfileMatchedProducts({
    hasProfile,
    matchedProductCount,
    matchedProducts,
    isLoading = false,
    noProfileHint = DEFAULT_NO_PROFILE_HINT,
    noMatchHint = DEFAULT_NO_MATCH_HINT,
    viewAllHref,
}: Props) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Eşleşen ürünler yükleniyor
            </div>
        )
    }

    if (!hasProfile) {
        return (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-5 text-sm text-amber-800">
                {noProfileHint}
            </div>
        )
    }

    if (matchedProductCount === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
                <PackageSearch className="mx-auto h-6 w-6 text-neutral-300" />
                <p className="mt-2 text-sm font-medium text-neutral-700">
                    Bu profille eşleşen ürün bulunamadı
                </p>
                <p className="mt-1 text-xs text-neutral-500">{noMatchHint}</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-neutral-800">
                    Bu profille eşleşen {matchedProductCount} ürün
                </span>
                {matchedProducts.length < matchedProductCount ? (
                    <Badge variant="outline" className="rounded-full text-[11px] font-normal">
                        ilk {matchedProducts.length} gösteriliyor
                    </Badge>
                ) : null}
                {viewAllHref ? (
                    <Button asChild type="button" variant="brand" size="sm" className="ms-auto rounded-full">
                        <Link href={viewAllHref}>
                            <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                            Ürünlerin tamamını gör
                        </Link>
                    </Button>
                ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {matchedProducts.map((product) => (
                    <div
                        key={product.id}
                        className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5"
                    >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                            {product.primaryImageUrl ? (
                                <Image
                                    src={product.primaryImageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="64px"
                                    className="object-contain p-1.5"
                                />
                            ) : (
                                <div className="grid h-full place-items-center text-neutral-300">
                                    <ImageIcon className="h-5 w-5" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="font-mono text-[11px] font-semibold text-neutral-950">
                                {product.code}
                            </div>
                            <div className="line-clamp-2 text-xs font-medium leading-4 text-neutral-700">
                                {product.name}
                            </div>
                            {product.matchedLabels.length > 0 ? (
                                <div className="mt-1 line-clamp-1 text-[11px] text-brand">
                                    {product.matchedLabels.join(" · ")}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
