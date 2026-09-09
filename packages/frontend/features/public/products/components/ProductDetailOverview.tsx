import type { ComponentProps } from "react"
import { getTranslations } from "next-intl/server"
import type ProductHero from "@/features/public/products/components/ProductHero"
import ProductAttributeBadges from "@/features/public/products/components/ProductAttributeBadges"
import ProductDetailMediaPreview from "@/features/public/products/components/ProductDetailMediaPreview"
import ProductQuickNav from "@/features/public/products/components/ProductQuickNav"
import ProductDescriptionDisclosure from "@/features/public/products/components/ProductDescriptionDisclosure"
import { splitProductTitleLines } from "@/features/public/products/utils/splitProductTitleLines"

type Props = Pick<ComponentProps<typeof ProductHero>, "product">

/**
 * Ürün detay sayfasının üst bölümü — hem public (`urun/[slug]`) hem müşteri
 * portalı (`musteri/tum-urunler/urun/[slug]`) AYNI bileşeni kullanır; ikisi
 * de aynı görsel yapıyı paylaşır, yalnız sayfa başlığı/breadcrumb farklıdır
 * (public `PageHero`, portal `CustomerPortalProductDetailHeader`).
 *
 * `lg` ve üstü: görsel / montaj videosu / metin (başlık+açıklama+rozet+buton)
 * ÜÇ ayrı sütun, `items-stretch` ile aynı başlangıç-bitiş hizasında (kullanıcı
 * talebiyle — önceki tasarımda video, metin sütununun köşesine sıkışmış küçük
 * bir kareydi). Görsel (`aspect-4/3`) ve video (`aspect-video` + ince alt bant)
 * FARKLI oranlar taşıdığı için piksel-eşit yükseklik garanti edilemez; genişlikleri
 * (`lg:w-95` / `lg:w-112`) ikisinin de HESAPLANMIŞ toplam yüksekliği ~285px
 * civarında eşitlenecek şekilde seçildi (video: 448px genişlikte 16:9 thumbnail
 * + alt bant; görsel: 380px genişlikte 4:3) ve video `self-start` ile üstten
 * hizalanır — üst kenar KESİN eşleşir, alt kenar yaklaşık (piksel bazında
 * kubi'de doğrulanmalı, footer'ın gerçek yüksekliği tahminî). Metin sütunu
 * `justify-start` ile (kullanıcı talebiyle) tüm içerik satırın ÜST kenarında
 * kümelenir — görsel/videoyla aynı kenardan başlar, altta boş kalan alan
 * doldurulmaya çalışılmaz. `lg`'nin altında
 * (mobil/tablet) tek sütun: görsel, video, metin alt alta — video/görseli iki
 * kez render ETMEMEK için (performans: `ProductDetailMediaPreview` client
 * component + görsel `priority` ile eager yükleniyor) tek bir DOM ağacı
 * kullanılıyor, `lg:` yalnız aynı elemanların düzenini (flex-col → flex-row)
 * değiştiriyor.
 */
export default async function ProductDetailOverview({ product }: Props) {
    const t = await getTranslations("public.productDetail")
    const primary = product.assets?.find((asset) => asset.role === "PRIMARY" && asset.url)
    const { firstLine, secondLine } = splitProductTitleLines(product.name)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:gap-10">
                <div className="shrink-0 lg:w-95">
                    <ProductDetailMediaPreview
                        imageUrl={primary?.url}
                        productName={product.name}
                    />
                </div>

                {product.assemblyVideoUrl ? (
                    <div className="shrink-0 lg:w-md lg:self-start">
                        <ProductDetailMediaPreview
                            videoUrl={product.assemblyVideoUrl}
                            productName={product.name}
                            mediaOnly
                        />
                    </div>
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col justify-start gap-5">
                    <div className="flex flex-col gap-5">
                        <h2 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
                            <span className="block">{firstLine}</span>
                            {secondLine ? <span className="block">{secondLine}</span> : null}
                        </h2>

                        <ProductDescriptionDisclosure
                            description={product.description || t("descriptionFallback")}
                            productName={product.name}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-5 border-t border-border pt-5">
                        <ProductAttributeBadges attributeValues={product.attributeValues ?? []} subtle />

                        {/* <Button asChild size="lg" variant="brand" className="h-auto min-h-11 w-full justify-center gap-4 whitespace-normal py-3 text-center lg:w-auto lg:self-center lg:px-12">
                            <a href="#product-variants">
                                {t("quickNav.dimensions")}
                                <ArrowDown data-icon="inline-end" />
                            </a>
                        </Button> */}
                    </div>
                </div>
            </div>

            <ProductQuickNav variant="strip" />
        </div>
    )
}
