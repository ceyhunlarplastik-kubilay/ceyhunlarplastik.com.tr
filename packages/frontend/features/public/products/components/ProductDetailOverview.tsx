import type { ComponentProps } from "react"
import { getTranslations } from "next-intl/server"
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type ProductHero from "@/features/public/products/components/ProductHero"
import ProductAttributeBadges from "@/features/public/products/components/ProductAttributeBadges"
import ProductDetailMediaPreview from "@/features/public/products/components/ProductDetailMediaPreview"
import ProductQuickNav from "@/features/public/products/components/ProductQuickNav"
import ProductDescriptionDisclosure from "@/features/public/products/components/ProductDescriptionDisclosure"
import { splitProductTitleLines } from "@/features/public/products/utils/splitProductTitleLines"

type Props = Pick<ComponentProps<typeof ProductHero>, "product">

/** Public catalog composition; portal keeps its existing ProductHero layout. */
export default async function ProductDetailOverview({ product }: Props) {
    const t = await getTranslations("public.productDetail")
    const primary = product.assets?.find((asset) => asset.role === "PRIMARY" && asset.url)
    const { firstLine, secondLine } = splitProductTitleLines(product.name)

    return (
        <div className="flex flex-col gap-6">
            <div className="grid items-end gap-6 md:grid-cols-[380px_minmax(0,1fr)] lg:gap-10">
                <ProductDetailMediaPreview
                    imageUrl={primary?.url}
                    productName={product.name}
                />

                <div className="flex min-w-0 flex-col items-start gap-5 pt-2">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground lg:text-3xl">
                            <span className="block">{firstLine}</span>
                            {secondLine ? <span className="block">{secondLine}</span> : null}
                        </h2>
                    </div>

                    <ProductDescriptionDisclosure
                        description={product.description || t("descriptionFallback")}
                        productName={product.name}
                    />

                    <div className="@container w-full border-t border-border pt-5">
                        <div className="grid grid-cols-1 items-stretch gap-5 @min-[30rem]:grid-cols-[minmax(0,1fr)_16rem] @min-[38rem]:grid-cols-[minmax(0,1fr)_18rem] @min-[30rem]:gap-6">
                            <div className="flex min-w-0 flex-col justify-center gap-5">
                                <ProductAttributeBadges attributeValues={product.attributeValues ?? []} subtle />

                                <Button asChild size="lg" variant="brand" className="h-auto min-h-11 w-full justify-between gap-4 whitespace-normal py-3 text-start">
                                    <a href="#product-variants">
                                        {t("quickNav.dimensions")}
                                        <ArrowDown data-icon="inline-end" />
                                    </a>
                                </Button>
                            </div>

                            {product.assemblyVideoUrl ? (
                                <ProductDetailMediaPreview
                                    videoUrl={product.assemblyVideoUrl}
                                    productName={product.name}
                                    mediaOnly
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <ProductQuickNav variant="strip" />
        </div>
    )
}
