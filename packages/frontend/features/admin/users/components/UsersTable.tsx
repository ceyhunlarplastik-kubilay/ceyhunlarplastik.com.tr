"use client"

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UsersTableRow } from "@/features/admin/users/components/UsersTableRow"
import type { UserAccessDraft } from "@/features/admin/users/lib/userDrafts"
import type { CustomerOption } from "@/features/admin/users/schema/userEditor"
import { cn } from "@/lib/utils"

const USERS_TABLE_COLUMNS: ColumnDef<AdminUser>[] = [
    { id: "user", header: "Kullanıcı" },
    { id: "roleAccess", header: "Rol & Erişim" },
    { id: "portalLinks", header: "Portal Bağı" },
    { id: "dates", header: "Son Güncelleme" },
    { id: "actions", header: "Aksiyon" },
]

function getHeaderClass(columnId: string) {
    const base = "border-b border-neutral-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-4 py-3.5 align-top whitespace-normal text-[11px] font-semibold uppercase tracking-[0.16em] leading-4 text-neutral-500"
    if (columnId === "user") return cn("w-[250px] pl-5", base)
    if (columnId === "roleAccess") return cn("w-[160px]", base)
    if (columnId === "portalLinks") return cn("w-[190px]", base)
    if (columnId === "dates") return cn("w-[130px]", base)
    if (columnId === "actions") return cn("w-[220px] pr-5 text-right", base)
    return base
}

function LoadingRow() {
    return (
        <TableRow>
            <TableCell colSpan={5} className="py-14">
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50" />
                    ))}
                </div>
            </TableCell>
        </TableRow>
    )
}

function EmptyRow() {
    return (
        <TableRow>
            <TableCell colSpan={5} className="py-16">
                <div className="text-center">
                    <div className="text-sm font-medium text-neutral-800">Filtrelere uygun kullanıcı bulunamadı.</div>
                    <div className="mt-1 text-xs text-neutral-500">Arama veya hızlı filtreleri genişletip tekrar deneyin.</div>
                </div>
            </TableCell>
        </TableRow>
    )
}

type Props = {
    users: AdminUser[]
    draftsByUserId: Record<string, UserAccessDraft>
    suppliers: Supplier[]
    customers: CustomerOption[]
    isLoading: boolean
    savingUserId: string | null
    selectedUserIds: string[]
    onToggleSelected: (userId: string) => void
    onOpenDetails: (user: AdminUser) => void
    onOpenProfileEditor: (user: AdminUser) => void
    onOpenAccessEditor: (user: AdminUser) => void
    onOpenDeleteDialog: (user: AdminUser) => void
    getDeleteBlockReason: (user: AdminUser) => string | null
    onSave: (userId: string) => void
}

export function UsersTable({
    users,
    draftsByUserId,
    suppliers,
    customers,
    isLoading,
    savingUserId,
    selectedUserIds,
    onToggleSelected,
    onOpenDetails,
    onOpenProfileEditor,
    onOpenAccessEditor,
    onOpenDeleteDialog,
    getDeleteBlockReason,
    onSave,
}: Props) {
    const table = useReactTable({
        data: users,
        columns: USERS_TABLE_COLUMNS,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (user) => user.id,
    })

    return (
        <div className="hidden overflow-hidden rounded-[26px] border border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] shadow-sm lg:block">
            <Table className="min-w-[940px] table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className={getHeaderClass(header.column.id)}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {isLoading ? <LoadingRow /> : null}

                    {!isLoading && table.getRowModel().rows.map((row) => {
                        const user = row.original

                        return (
                            <UsersTableRow
                                key={row.id}
                                user={user}
                                draft={draftsByUserId[user.id]}
                                suppliers={suppliers}
                                customers={customers}
                                isSaving={savingUserId === user.id}
                                isSelected={selectedUserIds.includes(user.id)}
                                onToggleSelected={() => onToggleSelected(user.id)}
                                onOpenDetails={() => onOpenDetails(user)}
                                onOpenProfileEditor={() => onOpenProfileEditor(user)}
                                onOpenAccessEditor={() => onOpenAccessEditor(user)}
                                onOpenDeleteDialog={() => onOpenDeleteDialog(user)}
                                canDelete={!getDeleteBlockReason(user)}
                                deleteDisabledReason={getDeleteBlockReason(user)}
                                onSave={() => onSave(user.id)}
                            />
                        )
                    })}

                    {!isLoading && table.getRowModel().rows.length === 0 ? <EmptyRow /> : null}
                </TableBody>
            </Table>
        </div>
    )
}
