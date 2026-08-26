"use client"

import { useState } from "react"
import { Pencil, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { ProductSupplierCodesDialog } from "@/features/admin/productSupplierCodes/components/ProductSupplierCodesDialog"
import { useProductSupplierCodes } from "@/features/admin/productSupplierCodes/hooks/useProductSupplierCodes"

type Props = {
    productId: string
    productCode: string
    productName: string
    canDelete: boolean
}

/**
 * Rail'deki tedarikçi harfi özeti — versiyon sözlüğü panelinin ikizi.
 *
 * Sözlük burada durur çünkü harf ürün modeline özeldir ve veri girişinden ÖNCE
 * kurulması işi kolaylaştırır: operatör kataloğu eline aldığında hangi harfin
 * hangi firma olduğunu görür.
 */
export function ProductSupplierCodesPanel({ productId, productCode, productName, canDelete }: Props) {
    const [open, setOpen] = useState(false)
    const { data: codes, isLoading } = useProductSupplierCodes(productId)

    const entries = codes ?? []

    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    <Truck className="size-3.5" />
                    Tedarikçi sözlüğü
                </h2>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setOpen(true)}
                >
                    <Pencil className="mr-1 size-3" />
                    Düzenle
                </Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-8 w-full" />
            ) : entries.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-[11px] leading-relaxed text-neutral-500">
                    Tanımlı harf yok. Tanımlamazsanız ilk kullanımda sırayla verilir (A, B, C…).
                </p>
            ) : (
                <>
                    <div className="flex flex-wrap gap-1">
                        {entries.map((entry) => (
                            <Badge
                                key={entry.id}
                                variant="secondary"
                                className="font-mono text-[11px]"
                                title={entry.supplier.name}
                            >
                                {entry.code} · {entry.supplier.name}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-500">
                        Harfler bu ürün modeline özeldir ve sonradan değiştirilemez.
                    </p>
                </>
            )}

            <ProductSupplierCodesDialog
                open={open}
                onOpenChange={setOpen}
                productId={productId}
                productCode={productCode}
                productName={productName}
                canDelete={canDelete}
            />
        </section>
    )
}
