"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, Layers, Lock, LockOpen, RefreshCw } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { MeasurementRequirementsPanel } from "@/features/admin/productMeasurementRequirements/components/MeasurementRequirementsPanel"
import { VariantAssetPreview } from "@/features/admin/productVariantMatrix/components/VariantAssetPreview"

type ProductAsset = { role?: string; type?: string; url?: string }

type Props = {
    productId: string
    productsBasePath: string
    code: string
    name: string
    categoryName: string | null
    assets: ProductAsset[]
    assetsLoading: boolean
    variantCount: number
    sizeCount: number
    lockedAt: string | null
    canManageCodes: boolean
    isLockPending: boolean
    isRenumberPending: boolean
    onToggleLock: (locked: boolean) => void
    onRenumber: () => void
}

function pickAsset(assets: ProductAsset[], role: string) {
    return assets.find((asset) => asset.role === role && asset.url)?.url ?? null
}

/**
 * Sayfanın sol sütunu: hangi ürün modelinde çalışıldığı, ölçü şablonu ve kod durumu.
 *
 * Sabit kalır çünkü operatör satır girerken bunlara sürekli bakar — görsel ve teknik
 * resim birbirine çok benzeyen modelleri ayırmanın tek yolu, şablon da tablodaki
 * kolonların neden o kolonlar olduğunu açıklıyor.
 */
export function VariantMatrixContextRail({
    productId, productsBasePath, code, name, categoryName,
    assets, assetsLoading, variantCount, sizeCount,
    lockedAt, canManageCodes, isLockPending, isRenumberPending,
    onToggleLock, onRenumber,
}: Props) {
    const isLocked = Boolean(lockedAt)
    const primaryImage =
        pickAsset(assets, "PRIMARY") ??
        pickAsset(assets, "ANIMATION") ??
        assets.find((asset) => asset.type === "IMAGE" && asset.url)?.url ??
        null
    const technicalDrawing = pickAsset(assets, "TECHNICAL_DRAWING")

    return (
        <aside className="flex w-full shrink-0 flex-col gap-5 border-b p-5 lg:sticky lg:top-0 lg:h-dvh lg:w-76 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
                <Link href={productsBasePath}>
                    <ArrowLeft className="mr-1 size-4" />
                    Ürünler
                </Link>
            </Button>

            {/* Alt alta: dar sütunda yan yana iki kare çok küçük kalıyordu. */}
            <div className="flex flex-col gap-3">
                {assetsLoading ? (
                    <>
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                    </>
                ) : (
                    <>
                        <VariantAssetPreview src={primaryImage} alt={`${name} ürün görseli`} label="Ürün" />
                        <VariantAssetPreview src={technicalDrawing} alt={`${name} teknik resmi`} label="Teknik resim" />
                    </>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="font-mono">{code}</Badge>
                    {categoryName ? <Badge variant="outline">{categoryName}</Badge> : null}
                </div>
                <h1 className="text-[15px] font-semibold leading-snug">{name}</h1>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1.5">
                        <Layers className="size-3.5" />
                        {variantCount} varyant
                    </span>
                </div>
            </div>

            <div className="h-px bg-border" />

            <MeasurementRequirementsPanel
                productId={productId}
                isDraftMode={!isLocked}
                sizeCount={sizeCount}
            />

            <div className="h-px bg-border" />

            <section className="space-y-2">
                <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Kod durumu</h2>
                <div className="flex items-center gap-2">
                    <Badge variant={isLocked ? "default" : "secondary"} className="gap-1">
                        {isLocked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
                        {isLocked ? "Kilitli" : "Taslak"}
                    </Badge>
                    <span className="text-xs text-neutral-500">{sizeCount} ölçü</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                    {isLocked
                        ? "Yeni ölçüler araya girmez, sona eklenir."
                        : "Her kayıtta ölçüler küçükten büyüğe yeniden numaralanır. Giriş bitince kilitleyin."}
                </p>

                {canManageCodes ? (
                    <div className="space-y-2 pt-1">
                        {isLocked ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full" disabled={isLockPending}>
                                        <LockOpen className="mr-2 size-4" />
                                        Kilidi aç
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Kod kilidini aç</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Kilidi açmak mevcut kodları hemen değiştirmez. Ancak bundan sonraki her
                                            kayıtta ölçüler yeniden sıralanabilir; katalog veya tekliflerde geçen
                                            kodlar bu üründe artık kalıcı sayılmaz.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onToggleLock(false)}>Kilidi aç</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button size="sm" className="w-full" onClick={() => onToggleLock(true)} disabled={isLockPending}>
                                <Lock className="mr-2 size-4" />
                                Kodları kilitle
                            </Button>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full text-neutral-500" disabled={isRenumberPending}>
                                    <RefreshCw className="mr-2 size-4" />
                                    Yeniden numaralandır
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="size-4 text-amber-600" />
                                        Tüm kodları baştan ver
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu ürünün TÜM ölçü ve versiyon kodları küçükten büyüğe yeniden verilir ve
                                        kilit yok sayılır. Kodlar katalog, teklif veya siparişlerde geçtiyse
                                        geçmişle uyum bozulur. Bu işlem geri alınamaz.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={onRenumber}>Yine de yeniden numaralandır</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : null}
            </section>
        </aside>
    )
}
