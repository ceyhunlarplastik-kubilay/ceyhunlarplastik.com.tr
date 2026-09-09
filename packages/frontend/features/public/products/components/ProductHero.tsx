"use client"

import Image from "next/image"
import type { ComponentProps } from "react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { AnimatedSplitProductTitle } from "@/features/public/products/components/AnimatedSplitProductTitle"
import ProductAttributeBadges from "@/features/public/products/components/ProductAttributeBadges"
import ProductAssemblyVideoSection from "@/features/public/products/components/ProductAssemblyVideoSection"
import ProductQuickNav from "@/features/public/products/components/ProductQuickNav"

type ProductHeroAsset = {
    id: string
    role?: string
    type?: string
    mimeType?: string
    url?: string
}

type ProductHeroProduct = {
    name: string
    code: string
    description?: string | null
    assemblyVideoUrl?: string | null
    assets?: ProductHeroAsset[]
    attributeValues?: ComponentProps<typeof ProductAttributeBadges>["attributeValues"]
}

type Props = {
    product: ProductHeroProduct
    showAssemblyVideoInline?: boolean
}

export default function ProductHero({
    product,
    showAssemblyVideoInline = false,
}: Props) {

    const t = useTranslations("public.productDetail")
    const primary = product.assets?.find((asset) => asset.role === "PRIMARY" && asset.url)

    return (
        <div className="space-y-4">
            {/* Model görselleri gerçekte ~800x1000 (4:5, dikey) — eski 50/50 sütun
                bölüşümü görseli olduğundan geniş bir kutuya sıkıştırıp gereksiz
                boşluk bırakıyordu. Görsel artık 1/3 sütunda kendi oranıyla
                (`AspectRatio`) render edilir, bilgi kartı 2/3'ü kullanır. */}
            <div className="grid items-start gap-3 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <AspectRatio
                        ratio={4 / 5}
                        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                    >
                        <Dialog>
                            <DialogTrigger asChild>
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    className="relative flex h-full w-full cursor-zoom-in items-center justify-center"
                                >
                                    {primary?.url ? (
                                        <Image
                                            src={primary.url}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-4"
                                            sizes="(min-width: 1024px) 33vw, 100vw"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-neutral-400">
                                            {t("imageNotFound")}
                                        </div>
                                    )}
                                </motion.div>
                            </DialogTrigger>

                            <DialogContent className="max-w-4xl">
                                <VisuallyHidden>
                                    <DialogTitle>{t("imageDialogTitle")}</DialogTitle>
                                </VisuallyHidden>

                                {primary?.url ? (
                                    <Image
                                        src={primary.url}
                                        alt={product.name}
                                        width={1200}
                                        height={900}
                                        className="w-full object-contain"
                                    />
                                ) : null}
                            </DialogContent>
                        </Dialog>
                    </AspectRatio>
                </div>

                <div className="flex flex-col justify-between gap-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-6 lg:col-span-2">
                    <div>
                        {/* Sayfanın h1'i PageHero'da (bkz. urun/[slug]/page.tsx) — aynı
                            product.name'i tekrar h1 yapmasın diye h2 (tipografi Dilim 2). */}
                        <h2 className="text-3xl font-semibold tracking-tight">
                            <AnimatedSplitProductTitle title={product.name} />
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {t("catalogCode", { code: product.code })}
                        </p>
                    </div>

                    {showAssemblyVideoInline ? (
                        <div id="product-assembly-video" className="scroll-mt-28">
                            <ProductAssemblyVideoSection
                                product={product}
                                videoOnly
                                imageMinHeightPx={220}
                            />
                        </div>
                    ) : null}

                    <ProductAttributeBadges
                        attributeValues={product.attributeValues ?? []}
                    />
                </div>
            </div>

            <div className="grid items-stretch gap-3 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative flex h-full min-h-55 items-center rounded-2xl border border-neutral-200 bg-linear-to-br from-neutral-50 to-white p-5 shadow-sm"
                >
                    <div className="absolute inset-s-0 top-0 h-full w-1 rounded-s-2xl bg-brand" />
                    <p className="ps-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                        {product.description || t("descriptionFallback")}
                    </p>
                </motion.div>

                <div className="flex h-full min-h-55 items-center rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 shadow-sm sm:p-5">
                    <ProductQuickNav className="mt-0 w-full" />
                </div>
            </div>
        </div>
    )
}
