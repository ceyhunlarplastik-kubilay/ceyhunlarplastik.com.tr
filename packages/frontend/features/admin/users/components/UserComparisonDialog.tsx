"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import {
    formatUserDateTime,
    getCustomerContactMeta,
    getInitials,
    getPortalLinkSummary,
    getUserAssignmentSummary,
} from "@/features/admin/users/lib/userDisplay"
import { getEffectiveDraft, type UserAccessDraft } from "@/features/admin/users/lib/userDrafts"
import type { CustomerOption } from "@/features/admin/users/schema/userEditor"
import { GROUP_LABELS } from "@/features/admin/users/schema/userEditor"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    users: AdminUser[]
    draftsByUserId: Record<string, UserAccessDraft>
    suppliers: Supplier[]
    customers: CustomerOption[]
}

export function UserComparisonDialog({
    open,
    onOpenChange,
    users,
    draftsByUserId,
    suppliers,
    customers,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto rounded-[28px] border border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] p-6">
                    <DialogHeader>
                        <DialogTitle>Kullanıcı Karşılaştırma</DialogTitle>
                        <DialogDescription>
                            Seçili iki kullanıcıyı rol, erişim, portal bağı ve operasyon atamaları açısından yan yana inceleyin.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-2">
                    {users.map((user) => {
                        const effective = getEffectiveDraft(user, draftsByUserId[user.id])
                        const displayName = getUserDisplayName(user) || user.email
                        const assignmentSummary = getUserAssignmentSummary(user, draftsByUserId[user.id])
                        const customerMeta = getCustomerContactMeta(user)
                        const portalSummary = getPortalLinkSummary(user, draftsByUserId[user.id], suppliers, customers)

                        return (
                            <div key={user.id} className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Avatar size="lg" className="ring-1 ring-neutral-200">
                                        <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-neutral-950">{displayName}</div>
                                        <div className="truncate text-xs text-neutral-500">{user.email}</div>
                                        <div className="truncate text-xs text-neutral-400">@{user.identifier}</div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 text-sm text-neutral-700">
                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                                        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">Rol ve erişim</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
                                                {GROUP_LABELS[effective.group]}
                                            </Badge>
                                            <UserAccessStatusBadge status={effective.accessStatus} />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                                        <div><span className="font-medium text-neutral-950">Portal tedarikçi:</span> {portalSummary.supplierName ?? "Bağ yok"}</div>
                                        <div><span className="font-medium text-neutral-950">Portal müşteri:</span> {portalSummary.customerName ?? "Bağ yok"}</div>
                                        {effective.customerId === user.customerId && customerMeta ? (
                                            <div><span className="font-medium text-neutral-950">İletişim meta verisi:</span> {customerMeta}</div>
                                        ) : null}
                                    </div>

                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                                        <div><span className="font-medium text-neutral-950">Satın alma atamaları:</span> {assignmentSummary.purchasingCount}</div>
                                        <div><span className="font-medium text-neutral-950">Satış atamaları:</span> {assignmentSummary.salesCount}</div>
                                        <div><span className="font-medium text-neutral-950">Kayıt tarihi:</span> {formatUserDateTime(user.createdAt)}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
