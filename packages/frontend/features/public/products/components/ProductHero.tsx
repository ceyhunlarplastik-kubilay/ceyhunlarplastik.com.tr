"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import ProductAttributeBadges from "@/features/public/products/components/ProductAttributeBadges"

type Props = {
    product: any
}

export default function ProductHero({ product }: Props) {

    const primary = product.assets?.find((a: any) => a.role === "PRIMARY")

    return (
        <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* IMAGE */}

            <Dialog>

                <DialogTrigger asChild>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="
            relative aspect-square
            border rounded-xl
            overflow-hidden
            cursor-zoom-in
            bg-white
            "
                    >

                        {primary ? (
                            <Image
                                src={primary.url}
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                Görsel bulunamadı
                            </div>
                        )}

                    </motion.div>

                </DialogTrigger>

                <DialogContent className="max-w-4xl">

                    <VisuallyHidden>
                        <DialogTitle>Ürün görseli</DialogTitle>
                    </VisuallyHidden>

                    {primary && (
                        <Image
                            src={primary.url}
                            alt={product.name}
                            width={1200}
                            height={900}
                            className="object-contain w-full"
                        />
                    )}

                </DialogContent>

            </Dialog>


            {/* PRODUCT INFO */}

            <div className="space-y-6">

                <div>

                    <h1 className="text-3xl font-semibold tracking-tight">
                        {product.name}
                    </h1>

                    <p className="text-neutral-500 mt-2">
                        Katalog Kodu: {product.code}
                    </p>

                </div>

                {/* 🔥 ATTRIBUTE BADGES */}
                <ProductAttributeBadges
                    attributeValues={product.attributeValues}
                />

                {product.description && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="
            relative
            rounded-xl
            border border-neutral-200
            bg-gradient-to-br from-neutral-50 to-white
            p-5
            shadow-sm
        "
                    >
                        {/* 🔥 SOL ACCENT BAR */}
                        <div className="absolute left-0 top-0 h-full w-1 bg-brand rounded-l-xl" />

                        {/* CONTENT */}
                        <p className="text-neutral-700 leading-relaxed text-sm sm:text-base pl-3">
                            {product.description}
                        </p>
                    </motion.div>
                )}

                <p className="text-neutral-500 text-sm">
                    Teknik detaylar ve ölçü seçeneklerini aşağıdan inceleyebilirsiniz.
                </p>

            </div>

        </div>
    )
}