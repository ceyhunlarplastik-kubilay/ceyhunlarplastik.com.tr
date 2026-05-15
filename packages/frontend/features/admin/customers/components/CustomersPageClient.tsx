"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
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

import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { CustomerListFilters } from "@/features/admin/customers/components/CustomerListFilters"
import { useCustomers } from "@/features/admin/customers/hooks/useCustomers"
import { useCustomerListFilters } from "@/features/admin/customers/hooks/useCustomerListFilters"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useUsers } from "@/features/admin/users/hooks/useUsers"

type Props = {
    title?: string
    description?: string
    lockedStatus?: "LEAD" | "CUSTOMER"
    statusLabel?: string
    hideStatusFilter?: boolean
}

export function CustomersPageClient({
    title = "CRM Müşterileri",
    description = "Potansiyel müşterileri, cari müşterileri ve satış temsilcisi atamalarını tek yerden yönetin.",
    lockedStatus,
    statusLabel = "müşteri",
    hideStatusFilter = false,
}: Props = {}) {
    const {
        filters,
        params,
        setSearch,
        setStatus,
        setAssignedSalesUserId,
        setSectorValueId,
        setProductionGroupValueId,
        setUsageAreaValueId,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useCustomerListFilters({
        lockedStatus,
    })

    const customersQuery = useCustomers({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const attrsQuery = useAttributesForFilter()
    const usersQuery = useUsers({
        params: {
            page: 1,
            limit: 500,
        },
    })

    const customers = customersQuery.data?.data ?? []
    const meta = customersQuery.data?.meta

    const attributes = useMemo(() => attrsQuery.data ?? [], [attrsQuery.data])
    const salesUsers = useMemo(
        () => (usersQuery.data?.data ?? [])
            .filter((user) => user.groups.includes("sales") || user.groups.includes("sales_director") || user.groups.includes("admin") || user.groups.includes("owner"))
            .map((user) => ({
                id: user.id,
                label: user.identifier || user.email,
            })),
        [usersQuery.data?.data],
    )

    const sectorValues = useMemo(
        () => attributes.find((attribute) => attribute.code === "sector")?.values ?? [],
        [attributes]
    )

    const productionGroupValues = useMemo(() => {
        const all = attributes.find((attribute) => attribute.code === "production_group")?.values ?? []
        if (!filters.sectorValueId) return all
        return all.filter((value) => value.parentValueId === filters.sectorValueId)
    }, [attributes, filters.sectorValueId])

    const usageAreaValues = useMemo(() => {
        const all = attributes.find((attribute) => attribute.code === "usage_area")?.values ?? []
        if (filters.productionGroupValueId) {
            return all.filter((value) => value.parentValueId === filters.productionGroupValueId)
        }

        if (filters.sectorValueId) {
            const allowedProdIds = new Set(
                (attributes.find((attribute) => attribute.code === "production_group")?.values ?? [])
                    .filter((value) => value.parentValueId === filters.sectorValueId)
                    .map((value) => value.id)
            )

            return all.filter((value) => (value.parentValueId ? allowedProdIds.has(value.parentValueId) : false))
        }

        return all
    }, [attributes, filters.productionGroupValueId, filters.sectorValueId])

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
                <p className="text-neutral-500 text-sm">
                    {description}
                </p>
            </div>

            <CustomerListFilters
                search={filters.search}
                status={filters.status}
                hideStatusFilter={hideStatusFilter}
                assignedSalesUserId={filters.assignedSalesUserId}
                sectorValueId={filters.sectorValueId}
                productionGroupValueId={filters.productionGroupValueId}
                usageAreaValueId={filters.usageAreaValueId}
                salesUsers={salesUsers}
                sectorValues={sectorValues}
                productionGroupValues={productionGroupValues}
                usageAreaValues={usageAreaValues}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onAssignedSalesUserIdChange={setAssignedSalesUserId}
                onSectorValueIdChange={setSectorValueId}
                onProductionGroupValueIdChange={setProductionGroupValueId}
                onUsageAreaValueIdChange={setUsageAreaValueId}
            />

            <AdminListRefreshBar
                dataUpdatedAt={customersQuery.dataUpdatedAt}
                isFetching={customersQuery.isFetching}
                onRefresh={() => void customersQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                <Table className="min-w-[1180px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Satış Temsilcisi</TableHead>
                            <TableHead>İletişim</TableHead>
                            <TableHead>Sektör</TableHead>
                            <TableHead>Üretim Grubu</TableHead>
                            <TableHead>Kullanım Alanları</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                            <TableHead className="text-right pr-4">Tarih</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customersQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="py-12">
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
                                    <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                                        {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {customer.assignedSalesUser ? (
                                        <div>
                                            <div className="text-sm">{customer.assignedSalesUser.identifier}</div>
                                            <div className="text-xs text-neutral-500">{customer.assignedSalesUser.email}</div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-neutral-500">Atama yok</span>
                                    )}
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
                                <TableCell className="text-right">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/admin/customers/${customer.id}`}>Detay</Link>
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right pr-4 text-sm text-neutral-500">
                                    {new Date(customer.createdAt).toLocaleDateString("tr-TR")}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!customersQuery.isLoading && customers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="py-10 text-center text-sm text-neutral-500">
                                    Müşteri kaydı bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </div>

            <AdminListPagination
                page={meta?.page ?? filters.page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total}
                limit={filters.limit}
                itemLabel={statusLabel}
                onPageChange={setPage}
                onLimitChange={setLimit}
            />

            {customersQuery.isFetching && !customersQuery.isLoading && (
                <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
                    <Spinner className="size-4" />
                    Liste güncelleniyor...
                </div>
            )}
        </div>
    )
}
