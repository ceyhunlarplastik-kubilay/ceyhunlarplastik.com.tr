"use client"

import type { ReactNode } from "react"
import { Eye, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { Supplier } from "@/features/admin/suppliers/api/types"
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
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    open: boolean
    user: AdminUser | null
    draft: UserAccessDraft | undefined
    suppliers: Supplier[]
    customers: CustomerOption[]
    canRequestDelete: boolean
    deleteDisabledReason?: string | null
    onRequestDelete: (user: AdminUser) => void
    onOpenChange: (open: boolean) => void
}

function DetailSection({
    title,
    children,
}: {
    title: string
    children: ReactNode
}) {
    return (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{title}</h3>
            <div className="mt-3">{children}</div>
        </section>
    )
}

export function UserDetailsDialog({
    open,
    user,
    draft,
    suppliers,
    customers,
    canRequestDelete,
    deleteDisabledReason,
    onRequestDelete,
    onOpenChange,
}: Props) {
    if (!user) return null

    const displayName = getUserDisplayName(user) || user.email
    const effective = getEffectiveDraft(user, draft)
    const portalSummary = getPortalLinkSummary(user, draft, suppliers, customers)
    const assignmentSummary = getUserAssignmentSummary(user, draft)
    const customerMeta = getCustomerContactMeta(user)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto rounded-[28px] border border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] p-6">
                    <DialogHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <Avatar size="lg" className="size-16 ring-1 ring-neutral-200">
                                    <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                                        <Eye className="h-3.5 w-3.5" />
                                        Kullanıcı Detayı
                                    </div>
                                    <DialogTitle className="mt-3 truncate text-2xl font-semibold text-neutral-950">
                                        {displayName}
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 truncate text-sm text-neutral-500">
                                        {user.email} • @{user.identifier}
                                    </DialogDescription>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
                                            {GROUP_LABELS[effective.group]}
                                        </Badge>
                                        <UserAccessStatusBadge status={effective.accessStatus} />
                                        {!user.isActive ? (
                                            <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                                                Pasif kayıt
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </DialogHeader>
                </div>

                <div className="grid gap-4 p-6 lg:grid-cols-2">
                    <DetailSection title="Kimlik ve Kayıt">
                        <div className="grid gap-2 text-sm text-neutral-700">
                            <div><span className="font-medium text-neutral-950">Ad soyad:</span> {displayName}</div>
                            <div><span className="font-medium text-neutral-950">E-posta:</span> {user.email}</div>
                            <div><span className="font-medium text-neutral-950">Identifier:</span> @{user.identifier}</div>
                            <div><span className="font-medium text-neutral-950">Kayıt tarihi:</span> {formatUserDateTime(user.createdAt)}</div>
                            <div><span className="font-medium text-neutral-950">Son güncelleme:</span> {formatUserDateTime(user.updatedAt)}</div>
                            <div><span className="font-medium text-neutral-950">Son erişim kararı:</span> {formatUserDateTime(user.accessStatusChangedAt)}</div>
                        </div>
                    </DetailSection>

                    <DetailSection title="Rol ve Erişim">
                        <div className="space-y-3 text-sm text-neutral-700">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
                                    {GROUP_LABELS[effective.group]}
                                </Badge>
                                <UserAccessStatusBadge status={effective.accessStatus} />
                            </div>
                            <div><span className="font-medium text-neutral-950">Aktif gruplar:</span> {user.groups.join(", ") || "-"}</div>
                            <div><span className="font-medium text-neutral-950">Kayıt durumu:</span> {user.isActive ? "Aktif" : "Pasif"}</div>
                        </div>
                    </DetailSection>

                    <DetailSection title="Portal Bağları">
                        <div className="grid gap-2 text-sm text-neutral-700">
                            <div><span className="font-medium text-neutral-950">Tedarikçi portalı:</span> {portalSummary.supplierName ?? "Bağ yok"}</div>
                            <div><span className="font-medium text-neutral-950">Müşteri portalı:</span> {portalSummary.customerName ?? "Bağ yok"}</div>
                            {effective.customerId === user.customerId && customerMeta ? (
                                <div><span className="font-medium text-neutral-950">İletişim kartı:</span> {customerMeta}</div>
                            ) : null}
                        </div>
                    </DetailSection>

                    <DetailSection title="Operasyon Atamaları">
                        <div className="grid gap-3 text-sm text-neutral-700">
                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Satış atamaları</div>
                                <div className="mt-1 font-semibold text-neutral-950">{assignmentSummary.salesCount}</div>
                            </div>
                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Satın alma atamaları</div>
                                <div className="mt-1 font-semibold text-neutral-950">{assignmentSummary.purchasingCount}</div>
                            </div>
                        </div>
                    </DetailSection>
                </div>

                <div className="border-t border-neutral-200 bg-neutral-50/70 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-neutral-500">
                                Kullaniciyi silmeden once iliskili tarihsel kayitlarin olmadigini kontrol edin.
                            </p>
                            {deleteDisabledReason ? (
                                <p className="text-sm text-rose-600">{deleteDisabledReason}</p>
                            ) : null}
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={!canRequestDelete}
                                onClick={() => onRequestDelete(user)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Kullaniciyi Sil
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
