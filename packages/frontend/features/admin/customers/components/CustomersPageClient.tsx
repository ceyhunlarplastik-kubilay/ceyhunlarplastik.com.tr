"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

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

import { useCustomers } from "@/features/admin/customers/hooks/useCustomers"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"

export function CustomersPageClient() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [sectorValueId, setSectorValueId] = useState("")
    const [productionGroupValueId, setProductionGroupValueId] = useState("")
    const [usageAreaValueId, setUsageAreaValueId] = useState("")

    const params = useMemo(
        () => ({
            page,
            limit,
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(sectorValueId ? { sectorValueId } : {}),
            ...(productionGroupValueId ? { productionGroupValueId } : {}),
            ...(usageAreaValueId ? { usageAreaValueId } : {}),
        }),
        [page, limit, search, sectorValueId, productionGroupValueId, usageAreaValueId]
    )

    const customersQuery = useCustomers(params)
    const attrsQuery = useAttributesForFilter()

    const customers = customersQuery.data?.data ?? []
    const meta = customersQuery.data?.meta

    const attributes = attrsQuery.data ?? []

    const sectorValues = useMemo(
        () => attributes.find((attribute) => attribute.code === "sector")?.values ?? [],
        [attributes]
    )

    const productionGroupValues = useMemo(() => {
        const all = attributes.find((attribute) => attribute.code === "production_group")?.values ?? []
        if (!sectorValueId) return all
        return all.filter((value) => value.parentValueId === sectorValueId)
    }, [attributes, sectorValueId])

    const usageAreaValues = useMemo(() => {
        const all = attributes.find((attribute) => attribute.code === "usage_area")?.values ?? []
        if (productionGroupValueId) {
            return all.filter((value) => value.parentValueId === productionGroupValueId)
        }

        if (sectorValueId) {
            const allowedProdIds = new Set(
                (attributes.find((attribute) => attribute.code === "production_group")?.values ?? [])
                    .filter((value) => value.parentValueId === sectorValueId)
                    .map((value) => value.id)
            )

            return all.filter((value) => (value.parentValueId ? allowedProdIds.has(value.parentValueId) : false))
        }

        return all
    }, [attributes, productionGroupValueId, sectorValueId])

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Müşteri Talepleri</h1>
                <p className="text-neutral-500 text-sm">
                    Müşteri kayıtlarını listeleyin, filtreleyin ve iletişim bilgileriyle sektörel eşleşmeleri takip edin.
                </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                        placeholder="Müşteri ara (ad, firma, e-posta, telefon)"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-9"
                    />
                </div>

                <select
                    className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                    value={sectorValueId}
                    onChange={(e) => {
                        setSectorValueId(e.target.value)
                        setProductionGroupValueId("")
                        setUsageAreaValueId("")
                        setPage(1)
                    }}
                >
                    <option value="">Tüm Sektörler</option>
                    {sectorValues.map((value) => (
                        <option key={value.id} value={value.id}>{value.name}</option>
                    ))}
                </select>

                <select
                    className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                    value={productionGroupValueId}
                    onChange={(e) => {
                        setProductionGroupValueId(e.target.value)
                        setUsageAreaValueId("")
                        setPage(1)
                    }}
                >
                    <option value="">Tüm Üretim Grupları</option>
                    {productionGroupValues.map((value) => (
                        <option key={value.id} value={value.id}>{value.name}</option>
                    ))}
                </select>

                <select
                    className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                    value={usageAreaValueId}
                    onChange={(e) => {
                        setUsageAreaValueId(e.target.value)
                        setPage(1)
                    }}
                >
                    <option value="">Tüm Kullanım Alanları</option>
                    {usageAreaValues.map((value) => (
                        <option key={value.id} value={value.id}>{value.name}</option>
                    ))}
                </select>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>İletişim</TableHead>
                            <TableHead>Sektör</TableHead>
                            <TableHead>Üretim Grubu</TableHead>
                            <TableHead>Kullanım Alanları</TableHead>
                            <TableHead className="text-right pr-4">Tarih</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customersQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <div className="font-medium">{customer.fullName}</div>
                                    <div className="text-xs text-neutral-500">{customer.companyName || "Firma bilgisi yok"}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{customer.email}</div>
                                    <div className="text-xs text-neutral-500">{customer.phone}</div>
                                </TableCell>
                                <TableCell>{customer.sectorValue?.name ?? "-"}</TableCell>
                                <TableCell>{customer.productionGroupValue?.name ?? "-"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {(customer.usageAreaValues ?? []).length === 0 ? (
                                            <span className="text-sm text-neutral-500">-</span>
                                        ) : (
                                            (customer.usageAreaValues ?? []).map((value) => (
                                                <Badge key={`${customer.id}-${value.id}`} variant="secondary">
                                                    {value.name}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-4 text-sm text-neutral-500">
                                    {new Date(customer.createdAt).toLocaleDateString("tr-TR")}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!customersQuery.isLoading && customers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                    Müşteri kaydı bulunamadı.
                                </TableCell>
                            </TableRow>
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

            {customersQuery.isFetching && !customersQuery.isLoading && (
                <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
                    <Spinner className="size-4" />
                    Liste güncelleniyor...
                </div>
            )}
        </div>
    )
}
