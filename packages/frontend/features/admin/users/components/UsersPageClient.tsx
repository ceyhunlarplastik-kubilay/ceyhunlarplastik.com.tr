"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import { useUpdateUserSupplier } from "@/features/admin/users/hooks/useUpdateUserSupplier"
import { useUserListFilters } from "@/features/admin/users/hooks/useUserListFilters"
import { UserListFilters } from "@/features/admin/users/components/UserListFilters"

export function UsersPageClient() {
    const [draftSupplierByUserId, setDraftSupplierByUserId] = useState<Record<string, string>>({})

    const {
        filters,
        params,
        setSearch,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useUserListFilters()

    const userQuery = useUsers({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const supplierQuery = useSuppliers({ params: { page: 1, limit: 500 } })
    const updateMutation = useUpdateUserSupplier()

    const users = userQuery.data?.data ?? []
    const meta = userQuery.data?.meta
    const suppliers = supplierQuery.data?.data ?? []

    const onSave = async (userId: string) => {
        const draftValue = draftSupplierByUserId[userId]
        const supplierId = draftValue === "__none__" ? null : draftValue

        try {
            await updateMutation.mutateAsync({ id: userId, supplierId: supplierId || null })
            toast.success("Tedarikçi ataması güncellendi")
        } catch {
            toast.error("Atama güncellenemedi")
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Kullanıcılar</h1>
                <p className="text-neutral-500 text-sm">
                    Kullanıcıları görüntüleyin, supplier roldeki kullanıcılar için tedarikçi ataması yapın.
                </p>
            </div>

            <UserListFilters search={filters.search} onSearchChange={setSearch} />

            <AdminListRefreshBar
                dataUpdatedAt={userQuery.dataUpdatedAt}
                isFetching={userQuery.isFetching}
                onRefresh={() => void userQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kullanıcı</TableHead>
                            <TableHead>Gruplar</TableHead>
                            <TableHead>Atanan Tedarikçi</TableHead>
                            <TableHead className="text-right pr-4">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {userQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.map((user) => {
                            const selectedValue =
                                draftSupplierByUserId[user.id] ??
                                (user.supplierId ?? "__none__")

                            const canAssignSupplier = user.groups.includes("supplier") || user.groups.includes("owner") || user.groups.includes("admin")

                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium">{user.email}</div>
                                        <div className="text-xs text-neutral-500">{user.identifier}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.groups.length === 0 ? (
                                                <Badge variant="secondary">user</Badge>
                                            ) : user.groups.map((group) => (
                                                <Badge key={`${user.id}-${group}`} variant="secondary">
                                                    {group}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            disabled={!canAssignSupplier || supplierQuery.isLoading}
                                            value={selectedValue}
                                            onValueChange={(value) =>
                                                setDraftSupplierByUserId((prev) => ({
                                                    ...prev,
                                                    [user.id]: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="min-w-56">
                                                <SelectValue placeholder="Atama yok" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Atama yok</SelectItem>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2"
                                            disabled={!canAssignSupplier || updateMutation.isPending}
                                            onClick={() => onSave(user.id)}
                                        >
                                            <Users className="h-4 w-4" />
                                            Kaydet
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {!userQuery.isLoading && users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-sm text-neutral-500">
                                    Kullanıcı bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AdminListPagination
                page={meta?.page ?? filters.page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total}
                limit={filters.limit}
                itemLabel="kullanıcı"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </div>
    )
}
