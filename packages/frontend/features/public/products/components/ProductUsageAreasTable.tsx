"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { Activity, ImageOff } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import InteractiveZoomImage from "@/features/public/products/components/InteractiveZoomImage"

type AttributeValue = {
    id: string
    name: string
    parentValueId?: string | null
    attribute?: {
        code?: string
    }
    parentValue?: AttributeValue | null
}

type ProductLike = {
    attributeValues?: AttributeValue[]
    industrialUsages?: ProductIndustrialUsage[]
}

type ProductIndustrialUsage = {
    id?: string
    sectorValue?: AttributeValue | null
    productionGroupValue?: AttributeValue | null
    usageAreaValue?: AttributeValue | null
    usageFunction?: string | null
    imageUrl?: string | null
    displayOrder?: number
}

type Props = {
    product: ProductLike
    collapsible?: boolean
}

type Row = {
    sector: string
    productionGroup: string
    usageArea: string
    usageFunction: string
    imageUrl: string | null
}

const USAGE_FUNCTION_PREVIEW_LENGTH = 160
const USAGE_FUNCTION_SOFT_LIMIT = 110

function getAttributeCode(value?: AttributeValue | null) {
    return value?.attribute?.code ?? ""
}

function buildRows(attributeValues: AttributeValue[]): Row[] {
    const byId = new Map(attributeValues.map((value) => [value.id, value]))

    const getParent = (value?: AttributeValue | null) => {
        if (!value) return undefined
        return value.parentValue ?? (value.parentValueId ? byId.get(value.parentValueId) : undefined)
    }

    const usageValues = attributeValues.filter((value) => getAttributeCode(value) === "usage_area")
    const rows: Row[] = []
    const seen = new Set<string>()

    for (const usageValue of usageValues) {
        const productionGroupCandidate = getParent(usageValue)
        const productionGroup =
            getAttributeCode(productionGroupCandidate) === "production_group"
                ? productionGroupCandidate
                : undefined

        const sectorCandidate = getParent(productionGroup)
        const sector =
            getAttributeCode(sectorCandidate) === "sector"
                ? sectorCandidate
                : undefined

        const row = {
            sector: sector?.name ?? "-",
            productionGroup: productionGroup?.name ?? "-",
            usageArea: usageValue.name,
            usageFunction: "-",
            imageUrl: null,
        }

        const rowKey = `${row.sector}|${row.productionGroup}|${row.usageArea}`
        if (seen.has(rowKey)) continue
        seen.add(rowKey)
        rows.push(row)
    }

    return rows
}

function buildRowsFromIndustrialUsages(industrialUsages: ProductIndustrialUsage[]): Row[] {
    return [...industrialUsages]
        .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
        .map((usage) => ({
            sector: usage.sectorValue?.name ?? "-",
            productionGroup: usage.productionGroupValue?.name ?? "-",
            usageArea: usage.usageAreaValue?.name ?? "-",
            usageFunction: usage.usageFunction?.trim() || "-",
            imageUrl: usage.imageUrl ?? null,
        }))
}

function buildUsageFunctionPreview(value: string) {
    const normalizedValue = value.replace(/\s+/g, " ").trim()

    if (normalizedValue.length <= USAGE_FUNCTION_PREVIEW_LENGTH) {
        return {
            preview: normalizedValue,
            isTruncated: false,
        }
    }

    const softCutIndex = normalizedValue.lastIndexOf(" ", USAGE_FUNCTION_SOFT_LIMIT)
    const safeCutIndex = softCutIndex > 0 ? softCutIndex : USAGE_FUNCTION_PREVIEW_LENGTH

    return {
        preview: `${normalizedValue.slice(0, safeCutIndex).trimEnd()}...`,
        isTruncated: true,
    }
}

function UsageFunctionPreview({
    title,
    sector,
    productionGroup,
    value,
}: {
    title: string
    sector: string
    productionGroup: string
    value: string
}) {
    const { preview, isTruncated } = useMemo(() => buildUsageFunctionPreview(value), [value])

    if (!isTruncated) {
        return <p className="leading-6 break-words">{preview}</p>
    }

    return (
        <Dialog>
            <div className="space-y-2">
                <p className="leading-6 break-words">{preview}</p>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand transition hover:text-brand/80"
                    >
                        Devamını oku
                    </button>
                </DialogTrigger>
            </div>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {sector} / {productionGroup}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="text-sm leading-7 text-neutral-700 whitespace-pre-wrap break-words">
                        {value}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export default function ProductUsageAreasTable({ product, collapsible = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const rows = product.industrialUsages?.length
        ? buildRowsFromIndustrialUsages(product.industrialUsages)
        : buildRows((product.attributeValues ?? []) as AttributeValue[])
    const hasRows = rows.length > 0

    const emptyState = (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Activity className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-950">
                Endüstriyel kullanım alanı bekleniyor
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
                Bu ürün modeli için endüstriyel kullanım alanı bilgisi hazırlanıyor. Detaylı bilgi için ekibimizle iletişime geçebilirsiniz.
            </p>
        </div>
    )

    const table = hasRows ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-neutral-50">
                    <TableRow>
                        <TableHead className="w-14 px-4">#</TableHead>
                        <TableHead className="px-4">Sektör</TableHead>
                        <TableHead className="px-4">Üretim Grubu</TableHead>
                        <TableHead className="px-4">Kullanıldığı Endüstriyel Ürün</TableHead>
                        <TableHead className="w-[180px] px-4">Örnek Görsel</TableHead>
                        <TableHead className="px-4">Kullanım Fonksiyonu</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, index) => {
                        const rowKey = `${row.sector}-${row.productionGroup}-${row.usageArea}-${index}`

                        return (
                            <TableRow key={rowKey} className="hover:bg-neutral-50/50 transition-colors">
                                <TableCell className="px-4 text-neutral-500">{index + 1}</TableCell>
                                <TableCell className="px-4 font-medium text-neutral-900">{row.sector}</TableCell>
                                <TableCell className="px-4 text-neutral-600">{row.productionGroup}</TableCell>
                                <TableCell className="px-4 text-neutral-700">
                                    <div className="font-medium">{row.usageArea}</div>
                                </TableCell>
                                <TableCell className="px-4">
                                    {row.imageUrl ? (
                                        <div className="group block w-full text-left">
                                            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm transition group-hover:border-neutral-300">
                                                <div className="aspect-[4/3]">
                                                    <InteractiveZoomImage
                                                        src={row.imageUrl}
                                                        alt={`${row.usageArea} görseli`}
                                                        triggerLabel="Büyüt"
                                                        dialogTitle={`${row.usageArea} örnek kullanım görseli`}
                                                        dialogEyebrow={`${row.sector} / ${row.productionGroup}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                                                Büyütmek için aç
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center text-xs text-neutral-400">
                                            <div className="flex flex-col items-center gap-2 px-3">
                                                <ImageOff className="h-4 w-4" />
                                                <span>Görsel eklenmedi</span>
                                            </div>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-xl px-4 text-neutral-600">
                                    <UsageFunctionPreview
                                        title={row.usageArea}
                                        sector={row.sector}
                                        productionGroup={row.productionGroup}
                                        value={row.usageFunction}
                                    />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    ) : emptyState

    return (
        <section id="usage-area-table" className="pt-10">
            <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                    Ürün Modelimizin Kullanıldığı Endüstriyel Alanlar
                </h2>
                <p className="text-sm text-neutral-500">
                    Sektör, üretim grubu ve kullanım alanı bazında örnek kullanım eşleşmeleri.
                </p>
            </div>

            {collapsible ? (
                <motion.div
                    animate={isOpen || !hasRows ? {
                        scale: 1,
                        borderColor: "rgba(229, 231, 235, 1)",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                    } : {
                        scale: [1, 1.008, 0.996, 1.012, 1, 1],
                        borderColor: [
                            "rgba(229, 231, 235, 1)",
                            "rgba(204, 179, 110, 0.5)",
                            "rgba(229, 231, 235, 1)",
                            "rgba(204, 179, 110, 0.8)",
                            "rgba(229, 231, 235, 1)",
                            "rgba(229, 231, 235, 1)"
                        ],
                        boxShadow: [
                            "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                            "0 0 12px 2px rgba(204, 179, 110, 0.2)",
                            "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                            "0 0 18px 4px rgba(204, 179, 110, 0.35)",
                            "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                            "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                        ]
                    }}
                    transition={isOpen ? { duration: 0.3 } : {
                        duration: 2.2,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: "easeInOut"
                    }}
                    className="overflow-hidden rounded-2xl border bg-white"
                >
                    <Accordion
                        type="single"
                        collapsible
                        value={isOpen ? "usage-areas" : ""}
                        onValueChange={(val) => setIsOpen(val === "usage-areas")}
                    >
                        <AccordionItem value="usage-areas" className="border-b-0">
                            <AccordionTrigger className="px-5 py-4 text-sm font-semibold text-neutral-900 hover:no-underline hover:bg-brand/[0.02] transition-colors duration-200">
                                <div className="flex flex-1 items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                            <motion.div
                                                animate={isOpen ? { scale: 1 } : { scale: [1, 1.2, 0.95, 1.25, 1, 1] }}
                                                transition={isOpen ? {} : {
                                                    duration: 2.2,
                                                    repeat: Infinity,
                                                    repeatDelay: 1.5,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                <Activity className="h-5 w-5" />
                                            </motion.div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-neutral-900">
                                                Kullanıldığı Endüstriyel Alanlar
                                            </p>
                                            <p className="text-xs font-normal text-neutral-500 hidden sm:block">
                                                Ürünün kullanıldığı sektör, üretim grubu ve endüstriyel alanlar.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mr-2">
                                        {!isOpen && hasRows && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                                            >
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 animate-ping"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand"></span>
                                                </span>
                                                Detayları İncele
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {table}
                                </motion.div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </motion.div>
            ) : table}
        </section>
    )
}
