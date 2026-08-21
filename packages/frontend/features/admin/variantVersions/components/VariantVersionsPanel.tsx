"use client"

import { useState } from "react"
import { Layers, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { VariantVersionsDialog } from "@/features/admin/variantVersions/components/VariantVersionsDialog"
import { useVariantVersions } from "@/features/admin/variantVersions/hooks/useVariantVersions"

type Props = {
    productId: string
    productCode: string
    productName: string
    canDelete: boolean
}

/**
 * Rail'deki salt-okunur özet + düzenleme diyaloğunu açan düğme — ölçü şablonu
 * panelinin (`MeasurementRequirementsPanel`) birebir karşılığı.
 *
 * Sözlük burada durur çünkü varyant girişinin ÖN KOŞULUDUR: tanımsız bir renk +
 * hammadde kombinasyonuyla satır kaydedilemez.
 */
export function VariantVersionsPanel({ productId, productCode, productName, canDelete }: Props) {
    const [open, setOpen] = useState(false)
    const { data, isLoading } = useVariantVersions(productId)

    const versions = data?.versions ?? []

    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    <Layers className="size-3.5" />
                    Versiyon sözlüğü
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
            ) : versions.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-[11px] leading-relaxed text-neutral-500">
                    Tanımlı versiyon yok. Varyant girmeden önce en az bir renk + hammadde
                    kombinasyonu tanımlayın — tanımsız kombinasyon kaydedilemez.
                </p>
            ) : (
                <>
                    <div className="flex flex-wrap gap-1">
                        {versions.map((version) => (
                            <Badge
                                key={version.id}
                                variant="secondary"
                                className="gap-1 font-mono text-[11px]"
                                title={[
                                    version.color ? `${version.color.code} — ${version.color.name}` : "Renksiz",
                                    version.materials.map((m) => m.code ?? m.name).join(", "),
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            >
                                {version.color ? (
                                    <span
                                        className="size-2 shrink-0 rounded-full border"
                                        style={{ backgroundColor: version.color.hex }}
                                    />
                                ) : null}
                                V{version.code}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-500">
                        Numaralar bu ürün modeline özeldir ve sonradan değiştirilemez.
                    </p>
                </>
            )}

            <VariantVersionsDialog
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
