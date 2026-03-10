"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

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
                        Ürün Kodu: {product.code}
                    </p>

                </div>

                <p className="text-neutral-600 leading-relaxed">

                    Bu ürün grubuna ait farklı ölçü seçeneklerini aşağıdaki tabloda
                    inceleyebilirsiniz. Teknik çizimler ve ürün animasyonu
                    aşağıda yer almaktadır.

                </p>

            </div>

        </div>
    )
}