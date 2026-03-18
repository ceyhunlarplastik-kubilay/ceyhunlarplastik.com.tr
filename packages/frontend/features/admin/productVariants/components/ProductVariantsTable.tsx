"use client"

import { Box, Pencil, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"

import type { ProductVariant } from "@/features/admin/productVariants/api/types"

type Props = {
    variants: ProductVariant[]
    deletingId: string | null
    onEdit: (variant: ProductVariant) => void
    onDelete: (variant: ProductVariant) => void
}

export function ProductVariantsTable({
    variants,
    deletingId,
    onEdit,
    onDelete,
}: Props) {
    if (!variants.length) {
        return (
            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                        <Box className="w-7 h-7 text-neutral-300" />
                    </div>
                    <p className="font-medium text-neutral-900">Varyant bulunamadı</p>
                    <p className="text-sm text-neutral-500">Henüz bu ürüne ait varyant eklenmemiş.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-neutral-50/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-neutral-700 w-[220px]">Kod / Ad</TableHead>
                        <TableHead className="font-semibold text-neutral-700">Ölçüler</TableHead>
                        <TableHead className="font-semibold text-neutral-700 w-[140px]">Renk</TableHead>
                        <TableHead className="font-semibold text-neutral-700">Materyaller</TableHead>
                        <TableHead className="font-semibold text-neutral-700">Tedarikçiler</TableHead>
                        <TableHead className="text-right font-semibold text-neutral-700 pr-5 w-[96px]">İşlem</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <AnimatePresence>
                        {variants.map((variant) => (
                            <motion.tr
                                key={variant.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="group border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors"
                            >
                                <TableCell>
                                    <p className="font-mono text-xs text-neutral-500">{variant.fullCode}</p>
                                    <p className="font-semibold text-neutral-900 text-sm mt-0.5">{variant.name}</p>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variant.measurements.length === 0 ? (
                                            <span className="text-xs text-neutral-400 italic">–</span>
                                        ) : (
                                            variant.measurements
                                                .sort((a, b) => (a.measurementType.code < b.measurementType.code ? -1 : 1))
                                                .map((measurement) => (
                                                    <span
                                                        key={measurement.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium"
                                                    >
                                                        {measurement.measurementType.code}: {measurement.value}
                                                    </span>
                                                ))
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {variant.color ? (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full border border-neutral-200 shrink-0"
                                                style={{ backgroundColor: variant.color.hex ?? variant.color.hexCode }}
                                                title={`${variant.color.system} ${variant.color.code} - ${variant.color.name}`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm text-neutral-700 leading-none">
                                                    {variant.color.name}
                                                </p>
                                                <p className="text-[11px] text-neutral-400 mt-1 leading-none">
                                                    {variant.color.system} {variant.color.code}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-400 italic">–</span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variant.materials.length === 0 ? (
                                            <span className="text-xs text-neutral-400 italic">–</span>
                                        ) : (
                                            variant.materials.map((material) => (
                                                <Badge key={material.id} variant="secondary" className="text-xs">
                                                    {material.name}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variant.variantSuppliers.length === 0 ? (
                                            <span className="text-xs text-neutral-400 italic">–</span>
                                        ) : (
                                            variant.variantSuppliers.map((variantSupplier) => (
                                                <span
                                                    key={variantSupplier.id}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantSupplier.isActive
                                                        ? "bg-green-50 border-green-200 text-green-700"
                                                        : "bg-neutral-100 border-neutral-200 text-neutral-600"
                                                        }`}
                                                >
                                                    {variantSupplier.supplier.name}
                                                    {variantSupplier.isActive && <span className="ml-1 text-[10px]">✓</span>}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="text-right pr-4">
                                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                                            onClick={() => onEdit(variant)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => onDelete(variant)}
                                            disabled={deletingId === variant.id}
                                        >
                                            {deletingId === variant.id ? (
                                                <Spinner className="size-4 text-red-600" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </TableBody>
            </Table>
        </div>
    )
}
