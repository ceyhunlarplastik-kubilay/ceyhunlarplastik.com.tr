"use client"

import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type {
    VariantMeasurement,
    VariantTableData,
} from "@/features/public/products/components/ProductVariantTable"
import { formatMeasurementValue } from "@/features/public/products/utils/measurement"

interface ProductVariantDetailsTableProps {
    variants: VariantTableData[]
    selectedMeasurements: VariantMeasurement[]
}

export default function ProductVariantDetailsTable({
    variants,
    selectedMeasurements,
}: ProductVariantDetailsTableProps) {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-neutral-200 bg-white p-4"
            >
                <p className="text-sm font-medium text-neutral-700 mb-3">Seçilen Ölçü</p>
                <div className="flex flex-wrap gap-2">
                    {selectedMeasurements.length === 0 ? (
                        <p className="text-sm text-neutral-400">Geçerli bir ölçü seçimi bulunamadı.</p>
                    ) : (
                        selectedMeasurements.map((measurement) => (
                            <Badge key={measurement.id} variant="secondary">
                                {measurement.measurementType.name} ({measurement.measurementType.code}):{" "}
                                {formatMeasurementValue(measurement)}
                                {measurement.measurementType.baseUnit &&
                                measurement.measurementType.code !== "D" &&
                                measurement.measurementType.code !== "M"
                                    ? ` ${measurement.measurementType.baseUnit}`
                                    : ""}
                            </Badge>
                        ))
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
            >
                <div className="border-b border-neutral-100 px-4 py-3">
                    <h2 className="text-base font-semibold text-neutral-900">Varyantlar</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Seçilen ölçüye ait tüm varyantlar aşağıda listelenir.
                    </p>
                </div>

                {variants.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-400">Bu ölçü için varyant bulunamadı.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Code</TableHead>
                                <TableHead>Versiyon</TableHead>
                                <TableHead>Renk</TableHead>
                                <TableHead>Ham Madde</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {variants.map((variant, index) => (
                                <motion.tr
                                    key={variant.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, delay: index * 0.04 }}
                                    className="border-b last:border-0"
                                >
                                    <TableCell className="font-mono">{variant.fullCode}</TableCell>
                                    <TableCell>{variant.versionCode}</TableCell>
                                    <TableCell>
                                        {variant.color ? (
                                            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-neutral-200 text-xs text-neutral-700">
                                                <span
                                                    className="w-3 h-3 rounded-full border border-neutral-300"
                                                    style={{ backgroundColor: variant.color.hex || "#ddd" }}
                                                />
                                                {variant.color.name}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {variant.materials.length
                                            ? variant.materials
                                                .map((material) =>
                                                    material.code ? `${material.name} (${material.code})` : material.name
                                                )
                                                .join(", ")
                                            : "-"}
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </motion.div>
        </div>
    )
}
