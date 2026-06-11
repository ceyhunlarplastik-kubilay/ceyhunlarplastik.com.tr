"use client"

import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UsersMobileCard } from "@/features/admin/users/components/UsersMobileCard"
import type { UserAccessDraft } from "@/features/admin/users/lib/userDrafts"
import type { CustomerOption } from "@/features/admin/users/schema/userEditor"

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
    onOpenAccessEditor: (user: AdminUser) => void
    onSave: (userId: string) => void
}

export function UsersMobileList({
    users,
    draftsByUserId,
    suppliers,
    customers,
    isLoading,
    savingUserId,
    selectedUserIds,
    onToggleSelected,
    onOpenDetails,
    onOpenAccessEditor,
    onSave,
}: Props) {
    return (
        <div className="space-y-3 lg:hidden">
            {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-44 animate-pulse rounded-[24px] border border-neutral-200 bg-neutral-50" />
                ))
            ) : users.length === 0 ? (
                <div className="rounded-[24px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                    Filtrelere uygun kullanıcı bulunamadı.
                </div>
            ) : (
                users.map((user) => (
                    <UsersMobileCard
                        key={user.id}
                        user={user}
                        draft={draftsByUserId[user.id]}
                        suppliers={suppliers}
                        customers={customers}
                        isSaving={savingUserId === user.id}
                        isSelected={selectedUserIds.includes(user.id)}
                        onToggleSelected={() => onToggleSelected(user.id)}
                        onOpenDetails={() => onOpenDetails(user)}
                        onOpenAccessEditor={() => onOpenAccessEditor(user)}
                        onSave={() => onSave(user.id)}
                    />
                ))
            )}
        </div>
    )
}
