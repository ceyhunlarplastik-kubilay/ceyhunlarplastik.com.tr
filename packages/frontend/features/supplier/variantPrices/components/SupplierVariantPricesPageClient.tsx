"use client"

import { useMemo, useState } from "react"
import { Search, Pencil } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useSupplierVariantPrices } from "@/features/supplier/variantPrices/hooks/useSupplierVariantPrices"
import { EditSupplierPriceDialog } from "@/features/supplier/variantPrices/components/EditSupplierPriceDialog"
import type { SupplierVariantPrice } from "@/features/supplier/variantPrices/api/types"

export function SupplierVariantPricesPageClient() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [categoryId, setCategoryId] = useState("")
    const [productId, setProductId] = useState("")
    const [variantId, setVariantId] = useState("")
    const [editingRow, setEditingRow] = useState<SupplierVariantPrice | null>(null)
    const { data, isLoading, isError } = useSupplierVariantPrices({
        page,
        limit,
        sort: "updatedAt",
        order: "desc",
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(categoryId.trim() ? { categoryId: categoryId.trim() } : {}),
        ...(productId.trim() ? { productId: productId.trim() } : {}),
        ...(variantId.trim() ? { variantId: variantId.trim() } : {}),
    })

    const rows = data?.data ?? []
    const meta = data?.meta

    const decimalLikeToText = (
        value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
    ) => {
        if (value === null || value === undefined) return "-"
        if (typeof value === "number") return value.toFixed(2)
        if (typeof value === "string") {
            const asNumber = Number(value)
            return Number.isFinite(asNumber) ? asNumber.toFixed(2) : value
        }
        const sign = value.s === -1 ? "-" : ""
        const digits = Array.isArray(value.d) ? value.d.join("") : ""
        const exponent = typeof value.e === "number" ? value.e : digits.length - 1
        if (!digits) return "-"
        if (exponent >= digits.length - 1) {
            return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
        }
        if (exponent < 0) {
            return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
        }
        return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
    }

    const filterSummary = useMemo(
        () =>
            [
                categoryId ? `Kategori: ${categoryId}` : null,
                productId ? `Ürün: ${productId}` : null,
                variantId ? `Varyant: ${variantId}` : null,
            ]
                .filter(Boolean)
                .join(" · "),
        [categoryId, productId, variantId]
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (isError) {
        return <div className="p-6 text-sm text-red-500">Tedarikçi fiyatları yüklenemedi.</div>
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tedarikçi Fiyat Paneli</h1>
                <p className="text-sm text-neutral-500">
                    Size atanmış varyantların fiyatlarını buradan güncelleyebilirsiniz.
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    placeholder="Varyant kodu veya ad ile ara..."
                    className="pl-9"
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                    value={categoryId}
                    onChange={(e) => {
                        setCategoryId(e.target.value)
                        setPage(1)
                    }}
                    placeholder="Kategori ID ile filtrele"
                />
                <Input
                    value={productId}
                    onChange={(e) => {
                        setProductId(e.target.value)
                        setPage(1)
                    }}
                    placeholder="Ürün ID ile filtrele"
                />
                <Input
                    value={variantId}
                    onChange={(e) => {
                        setVariantId(e.target.value)
                        setPage(1)
                    }}
                    placeholder="Varyant ID ile filtrele"
                />
            </div>

            {filterSummary ? (
                <p className="text-xs text-neutral-500">{filterSummary}</p>
            ) : null}

            <div className="rounded-2xl border border-neutral-200/70 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50/50">
                        <TableRow>
                            <TableHead>Varyant Kodu</TableHead>
                            <TableHead>Varyant Adı</TableHead>
                            <TableHead>Fiyat</TableHead>
                            <TableHead>Para Birimi</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    Kayıt bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono text-xs text-neutral-700">
                                        {row.variant?.fullCode ?? "-"}
                                    </TableCell>
                                    <TableCell>{row.variant?.name ?? "-"}</TableCell>
                                    <TableCell>{decimalLikeToText(row.price)}</TableCell>
                                    <TableCell>{row.currency}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => setEditingRow(row)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Düzenle
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? page) <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    Önceki
                </Button>
                <span className="text-sm text-neutral-600">
                    Sayfa {meta?.page ?? page} / {meta?.totalPages ?? 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? page) >= (meta?.totalPages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Sonraki
                </Button>
                <select
                    className="ml-2 h-8 rounded-md border border-neutral-200 px-2 text-sm"
                    value={String(limit)}
                    onChange={(e) => {
                        setLimit(Number(e.target.value))
                        setPage(1)
                    }}
                >
                    <option value="10">10 / sayfa</option>
                    <option value="20">20 / sayfa</option>
                    <option value="50">50 / sayfa</option>
                </select>
            </div>

            <EditSupplierPriceDialog
                open={Boolean(editingRow)}
                row={editingRow}
                onOpenChange={(open) => {
                    if (!open) setEditingRow(null)
                }}
            />
        </div>
    )
}
