"use client"

import Image from "next/image"
import type { ComponentProps } from "react"
import { motion } from "motion/react"
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog"
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
    assets?: ProductHeroAsset[]
    attributeValues?: ComponentProps<typeof ProductAttributeBadges>["attributeValues"]
}

type Props = {
    product: ProductHeroProduct
    showAssemblyVideoInline?: boolean
    assemblyVideoAutoPlay?: boolean
}

export default function ProductHero({
    product,
    showAssemblyVideoInline = false,
    assemblyVideoAutoPlay = false,
}: Props) {

    const primary = product.assets?.find((asset) => asset.role === "PRIMARY" && asset.url)

    return (
        <div className="space-y-4">
            <div className="grid items-stretch gap-3 lg:grid-cols-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="relative flex h-full min-h-[320px] cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:min-h-[420px]"
                        >
                            {primary?.url ? (
                                <Image
                                    src={primary.url}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4"
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-neutral-400">
                                    Görsel bulunamadı
                                </div>
                            )}
                        </motion.div>
                    </DialogTrigger>

                    <DialogContent className="max-w-4xl">
                        <VisuallyHidden>
                            <DialogTitle>Ürün görseli</DialogTitle>
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

                <div className="flex h-full min-h-[320px] flex-col justify-between gap-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:min-h-[420px] sm:p-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            <AnimatedSplitProductTitle title={product.name} />
                        </h1>
                        <p className="mt-2 text-neutral-500">
                            Katalog Kodu: {product.code}
                        </p>
                    </div>

                    {showAssemblyVideoInline ? (
                        <div id="product-assembly-video" className="scroll-mt-28">
                            <ProductAssemblyVideoSection
                                product={product}
                                videoOnly
                                autoPlayVideo={assemblyVideoAutoPlay}
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
                    className="relative flex h-full min-h-[220px] items-center rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 shadow-sm"
                >
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-brand" />
                    <p className="pl-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                        {product.description || "Ürün açıklaması henüz eklenmemiştir."}
                    </p>
                </motion.div>

                <div className="flex h-full min-h-[220px] items-center rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 shadow-sm sm:p-5">
                    <ProductQuickNav className="mt-0 w-full" />
                </div>
            </div>
        </div>
    )
}
