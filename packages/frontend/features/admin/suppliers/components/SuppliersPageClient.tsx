"use client"

import { useMemo, useState } from "react"
import { Search, Truck, Package } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import { useSupplierVariantSuppliers } from "@/features/admin/suppliers/hooks/useSupplierVariantSuppliers"
import type { Supplier } from "@/features/admin/suppliers/api/types"

function decimalLikeToText(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    if (value === null || value === undefined) return "-"
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") return value
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

export function SuppliersPageClient() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [detailPage, setDetailPage] = useState(1)
    const [detailLimit, setDetailLimit] = useState(20)

    const supplierParams = useMemo(
        () => ({
            page,
            limit,
            ...(search.trim() ? { search: search.trim() } : {}),
        }),
        [page, limit, search]
    )

    const supplierQuery = useSuppliers(supplierParams)
    const detailQuery = useSupplierVariantSuppliers({
        supplierId: selectedSupplier?.id,
        page: detailPage,
        limit: detailLimit,
    })

    const suppliers = supplierQuery.data?.data ?? []
    const supplierMeta = supplierQuery.data?.meta
    const supplierRows = detailQuery.data?.data ?? []
    const supplierRowsMeta = detailQuery.data?.meta

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tedarikçiler</h1>
                <p className="text-neutral-500 text-sm">
                    Tedarikçileri listeleyin, seçin ve seçilen tedarikçiye bağlı varyant/fiyat kayıtlarını inceleyin.
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    placeholder="Tedarikçi ara..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="pl-9"
                />
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tedarikçi</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Oluşturma</TableHead>
                            <TableHead className="text-right pr-4">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {supplierQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>
                                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                                        {supplier.isActive ? "Aktif" : "Pasif"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-neutral-500">
                                    {new Date(supplier.createdAt).toLocaleDateString("tr-TR")}
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <Button
                                        size="sm"
                                        variant={selectedSupplier?.id === supplier.id ? "default" : "outline"}
                                        onClick={() => {
                                            setSelectedSupplier(supplier)
                                            setDetailPage(1)
                                        }}
                                        className="gap-2"
                                    >
                                        <Truck className="h-4 w-4" />
                                        Detaylar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!supplierQuery.isLoading && suppliers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-sm text-neutral-500">
                                    Tedarikçi bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" disabled={(supplierMeta?.page ?? page) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Önceki
                </Button>
                <span className="text-sm text-neutral-600">
                    Sayfa {supplierMeta?.page ?? page} / {supplierMeta?.totalPages ?? 1}
                </span>
                <Button variant="outline" size="sm" disabled={(supplierMeta?.page ?? page) >= (supplierMeta?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
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

            {selectedSupplier && (
                <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-neutral-800">
                        <Package className="h-4 w-4" />
                        <h2 className="font-semibold">
                            {selectedSupplier.name} · Ürün/Varyant Kayıtları
                        </h2>
                    </div>

                    <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Varyant Kodu</TableHead>
                                    <TableHead>Varyant Adı</TableHead>
                                    <TableHead>Fiyat</TableHead>
                                    <TableHead>Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailQuery.isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-12">
                                            <div className="flex items-center justify-center">
                                                <Spinner className="size-5" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : supplierRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-xs">{row.variant?.fullCode ?? "-"}</TableCell>
                                        <TableCell>{row.variant?.name ?? "-"}</TableCell>
                                        <TableCell>
                                            {decimalLikeToText(row.price)} {row.currency ?? "TRY"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={row.isActive ? "default" : "secondary"}>
                                                {row.isActive ? "Aktif" : "Pasif"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!detailQuery.isLoading && supplierRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-8 text-center text-sm text-neutral-500">
                                            Bu tedarikçiye ait varyant kaydı yok.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" disabled={(supplierRowsMeta?.page ?? detailPage) <= 1} onClick={() => setDetailPage((p) => Math.max(1, p - 1))}>
                            Önceki
                        </Button>
                        <span className="text-sm text-neutral-600">
                            Sayfa {supplierRowsMeta?.page ?? detailPage} / {supplierRowsMeta?.totalPages ?? 1}
                        </span>
                        <Button variant="outline" size="sm" disabled={(supplierRowsMeta?.page ?? detailPage) >= (supplierRowsMeta?.totalPages ?? 1)} onClick={() => setDetailPage((p) => p + 1)}>
                            Sonraki
                        </Button>
                        <select
                            className="ml-2 h-8 rounded-md border border-neutral-200 px-2 text-sm"
                            value={String(detailLimit)}
                            onChange={(e) => {
                                setDetailLimit(Number(e.target.value))
                                setDetailPage(1)
                            }}
                        >
                            <option value="10">10 / sayfa</option>
                            <option value="20">20 / sayfa</option>
                            <option value="50">50 / sayfa</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}
