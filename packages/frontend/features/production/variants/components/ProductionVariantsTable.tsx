"use client"

import { Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductionVariant } from "@/features/production/variants/api/types"

type Props = {
    variants: ProductionVariant[]
    onEdit: (variant: ProductionVariant) => void
}

/** İç üretim varyantları: kod, ölçü, versiyon, kalıp durumu ve varyanta özel çevrim. */
export function ProductionVariantsTable({ variants, onEdit }: Props) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Varyant</TableHead>
                    <TableHead className="hidden md:table-cell">Ölçü</TableHead>
                    <TableHead>Versiyon</TableHead>
                    <TableHead className="hidden sm:table-cell">Kalıp</TableHead>
                    <TableHead className="text-end">Çevrim</TableHead>
                    <TableHead className="w-12"><span className="sr-only">İşlemler</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {variants.map((variant) => (
                    <TableRow key={variant.id}>
                        <TableCell className="align-top whitespace-normal">
                            <div className="font-mono text-sm font-medium">{variant.fullCode}</div>
                            <div className="text-xs text-muted-foreground">{variant.product.name}</div>
                            <div className="text-xs text-muted-foreground md:hidden">{variant.size.label}</div>
                        </TableCell>
                        <TableCell className="hidden align-top text-sm whitespace-normal md:table-cell">{variant.size.label}</TableCell>
                        <TableCell className="align-top text-sm">
                            <span className="inline-flex items-center gap-1.5">
                                {variant.version.colorHex ? (
                                    <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: variant.version.colorHex }} />
                                ) : null}
                                <span className="font-medium">{variant.version.code}</span>
                            </span>
                            <div className="text-xs text-muted-foreground">
                                {[variant.version.colorName, variant.version.materials.join(" + ")].filter(Boolean).join(" · ") || "—"}
                            </div>
                        </TableCell>
                        <TableCell className="hidden align-top sm:table-cell">
                            {variant.usableMoldCount > 0 ? (
                                <Badge variant="outline" className="rounded-full">{variant.usableMoldCount} kalıp</Badge>
                            ) : (
                                <Badge variant="secondary" className="rounded-full" title="Bu ölçüyü basan kalıp tanımlanmadan üretim emri açılamaz">
                                    Kalıp yok
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-end align-top tabular-nums">
                            {variant.cycleTimeSec !== null ? (
                                <span className="font-medium">{variant.cycleTimeSec.toLocaleString("tr-TR")} sn</span>
                            ) : (
                                <span className="text-xs text-muted-foreground">kalıptan</span>
                            )}
                        </TableCell>
                        <TableCell className="align-top">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`${variant.fullCode} çevrimini düzenle`}
                                onClick={() => onEdit(variant)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
