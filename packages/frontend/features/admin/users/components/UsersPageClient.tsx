"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { toast } from "sonner"

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

import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import { useUpdateUserSupplier } from "@/features/admin/users/hooks/useUpdateUserSupplier"

export function UsersPageClient() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [draftSupplierByUserId, setDraftSupplierByUserId] = useState<Record<string, string>>({})

    const userParams = useMemo(
        () => ({
            page,
            limit,
            ...(search.trim() ? { search: search.trim() } : {}),
        }),
        [page, limit, search]
    )

    const userQuery = useUsers(userParams)
    const supplierQuery = useSuppliers({ page: 1, limit: 500 })
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

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    placeholder="Kullanıcı ara..."
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
                                        <select
                                            className="h-9 min-w-56 rounded-md border border-neutral-200 px-2 text-sm disabled:opacity-50"
                                            disabled={!canAssignSupplier || supplierQuery.isLoading}
                                            value={selectedValue}
                                            onChange={(e) =>
                                                setDraftSupplierByUserId((prev) => ({
                                                    ...prev,
                                                    [user.id]: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="__none__">Atama yok</option>
                                            {suppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
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
        </div>
    )
}
