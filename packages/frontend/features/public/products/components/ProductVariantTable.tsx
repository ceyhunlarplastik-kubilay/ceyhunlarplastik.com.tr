"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type MeasurementTypeDetails = {
    id: string;
    name: string;
    code: string;
    baseUnit: string;
    displayOrder: number;
}

export type VariantMeasurement = {
    id: string;
    value: number;
    label: string;
    measurementType: MeasurementTypeDetails;
}

export type VariantTableData = {
    id: string;
    name: string;
    versionCode: string;
    fullCode: string;
    measurements: VariantMeasurement[];
}

interface ProductVariantTableProps {
    variants: VariantTableData[];
}

export default function ProductVariantTable({ variants }: ProductVariantTableProps) {

    if (!variants?.length) {
        return (
            <div className="text-neutral-400 text-sm">
                Ölçü bilgisi bulunamadı
            </div>
        )
    }

    const measurementTypes = Array.from(
        new Map(
            variants
                .flatMap(v => v.measurements)
                .map(m => [m.measurementType.code, m.measurementType])
        ).values()
    ).sort((a: any, b: any) => a.displayOrder - b.displayOrder) as MeasurementTypeDetails[]

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {measurementTypes.map((type: MeasurementTypeDetails) => (
                        <TableHead key={type.code}>
                            {type.code}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>

            <TableBody>
                {variants.map((v: VariantTableData) => {
                    const map = Object.fromEntries(
                        v.measurements.map((m: VariantMeasurement) => [
                            m.measurementType.code,
                            m.value
                        ])
                    )

                    return (
                        <TableRow key={v.id}>
                            {measurementTypes.map((type: MeasurementTypeDetails) => (
                                <TableCell key={type.code}>
                                    {map[type.code] ?? "-"}
                                </TableCell>
                            ))}
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}