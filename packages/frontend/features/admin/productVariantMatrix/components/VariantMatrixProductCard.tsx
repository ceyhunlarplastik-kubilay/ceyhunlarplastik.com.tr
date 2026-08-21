"use client"

import Image from "next/image"
import { useState } from "react"
import { FileImage, ImageOff, Layers, Lock, LockOpen, Ruler } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type ProductAsset = {
    role?: string
    type?: string
    url?: string
}

type Props = {
    code: string
    name: string
    categoryName?: string | null
    assets: ProductAsset[]
    requirementCount: number
    variantCount: number
    isLocked: boolean
    isLoading?: boolean
}

function pickAsset(assets: ProductAsset[], role: string) {
    return assets.find((asset) => asset.role === role && asset.url)?.url ?? null
}

function pickPrimaryImage(assets: ProductAsset[]) {
    return (
        pickAsset(assets, "PRIMARY") ??
        pickAsset(assets, "ANIMATION") ??
        assets.find((asset) => asset.type === "IMAGE" && asset.url)?.url ??
        null
    )
}

function AssetFrame({ src, alt, label }: { src: string | null; alt: string; label: string }) {
    const [failed, setFailed] = useState(false)

    return (
        <figure className="space-y-1">
            <div className="relative size-24 overflow-hidden rounded-md border bg-neutral-50 dark:bg-neutral-900">
                {src && !failed ? (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="96px"
                        className="object-contain"
                        onError={() => setFailed(true)}
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-neutral-400">
                        <ImageOff className="size-5" />
                    </div>
                )}
            </div>
            <figcaption className="text-center text-[11px] text-neutral-500">{label}</figcaption>
        </figure>
    )
}

/**
 * Ekranın en üstünde HANGİ ürün modelinde çalışıldığını gösterir.
 *
 * Operatör kataloglardan sırayla giriş yaptığı için görsel ve teknik resim burada
 * kritik: kod ve ad tek başına iki benzer modeli ayırmaya yetmiyor.
 */
export function VariantMatrixProductCard({
    code,
    name,
    categoryName,
    assets,
    requirementCount,
    variantCount,
    isLocked,
    isLoading,
}: Props) {
    const primaryImage = pickPrimaryImage(assets)
    const technicalDrawing = pickAsset(assets, "TECHNICAL_DRAWING")

    return (
        <section className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div className="flex gap-3">
                {isLoading ? (
                    <>
                        <Skeleton className="size-24 rounded-md" />
                        <Skeleton className="size-24 rounded-md" />
                    </>
                ) : (
                    <>
                        <AssetFrame src={primaryImage} alt={`${name} ürün görseli`} label="Ürün" />
                        <AssetFrame src={technicalDrawing} alt={`${name} teknik resmi`} label="Teknik resim" />
                    </>
                )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-sm">{code}</Badge>
                    {categoryName ? <Badge variant="outline">{categoryName}</Badge> : null}
                    <Badge variant={isLocked ? "default" : "secondary"} className="gap-1">
                        {isLocked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
                        {isLocked ? "Kodlar kilitli" : "Taslak"}
                    </Badge>
                </div>

                <h1 className="text-lg font-semibold leading-tight">{name}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                        <Ruler className="size-4" />
                        {requirementCount} ölçü
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Layers className="size-4" />
                        {variantCount} varyant
                    </span>
                    {technicalDrawing ? (
                        <a
                            href={technicalDrawing}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 underline underline-offset-2"
                        >
                            <FileImage className="size-4" />
                            Teknik resmi büyüt
                        </a>
                    ) : null}
                </div>
            </div>
        </section>
    )
}
