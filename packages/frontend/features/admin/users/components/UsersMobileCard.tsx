"use client"

import { CheckCircle2, Eye, PencilLine, Save, Trash2, UserPen } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import {
    formatUserDateShort,
    getCustomerContactMeta,
    getInitials,
    getPortalLinkSummary,
    getUserAssignmentSummary,
} from "@/features/admin/users/lib/userDisplay"
import {
    getEffectiveDraft,
    isUserDraftDirty,
    validateUserDraft,
    type UserAccessDraft,
} from "@/features/admin/users/lib/userDrafts"
import type { CustomerOption } from "@/features/admin/users/schema/userEditor"
import { GROUP_LABELS, getUserDisplayGroup } from "@/features/admin/users/schema/userEditor"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    user: AdminUser
    draft: UserAccessDraft | undefined
    suppliers: Supplier[]
    customers: CustomerOption[]
    isSaving: boolean
    isSelected: boolean
    onToggleSelected: () => void
    onOpenDetails: () => void
    onOpenProfileEditor: () => void
    onOpenAccessEditor: () => void
    onOpenDeleteDialog: () => void
    canDelete: boolean
    deleteDisabledReason?: string | null
    onSave: () => void
}

export function UsersMobileCard({
    user,
    draft,
    suppliers,
    customers,
    isSaving,
    isSelected,
    onToggleSelected,
    onOpenDetails,
    onOpenProfileEditor,
    onOpenAccessEditor,
    onOpenDeleteDialog,
    canDelete,
    deleteDisabledReason,
    onSave,
}: Props) {
    const displayName = getUserDisplayName(user) || user.email
    const isDirty = isUserDraftDirty(user, draft)
    const validationError = validateUserDraft(user, draft)
    const roleLabel = GROUP_LABELS[(draft?.group ?? getUserDisplayGroup(user))]
    const status = draft?.accessStatus ?? user.accessStatus
    const effective = getEffectiveDraft(user, draft)
    const portalSummary = getPortalLinkSummary(user, draft, suppliers, customers)
    const assignmentSummary = getUserAssignmentSummary(user, draft)
    const customerMeta = getCustomerContactMeta(user)

    return (
        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <Checkbox checked={isSelected} onCheckedChange={onToggleSelected} className="mt-1" />
                <Avatar size="lg" className="ring-1 ring-neutral-200">
                    <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-neutral-950">{displayName}</div>
                    <div className="truncate text-xs text-neutral-500">{user.email}</div>
                    <div className="truncate text-xs text-neutral-400">@{user.identifier}</div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
                            {roleLabel}
                        </Badge>
                        <UserAccessStatusBadge status={status} />
                        {!user.isActive ? (
                            <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                                Pasif
                            </Badge>
                        ) : null}
                        {isDirty ? (
                            <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                                Taslak
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 text-sm text-neutral-700">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Portal Bağı</div>
                    <div className="mt-1 truncate">Tedarikçi: {portalSummary.supplierName ?? "Bağ yok"}</div>
                    <div className="truncate">Müşteri: {portalSummary.customerName ?? "Bağ yok"}</div>
                    {effective.customerId === user.customerId && customerMeta ? (
                        <div className="mt-1 truncate text-xs text-neutral-500">{customerMeta}</div>
                    ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Satış</div>
                        <div className="mt-1 font-semibold text-neutral-950">{assignmentSummary.salesCount}</div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Satın Alma</div>
                        <div className="mt-1 font-semibold text-neutral-950">{assignmentSummary.purchasingCount}</div>
                    </div>
                </div>

                <div className="text-xs text-neutral-500">
                    Güncelleme: {formatUserDateShort(user.updatedAt)} • Kayıt: {formatUserDateShort(user.createdAt)}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onOpenDetails}>
                    <Eye className="h-4 w-4" />
                    Detay
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onOpenProfileEditor}>
                    <UserPen className="h-4 w-4" />
                    Profil
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onOpenAccessEditor}>
                    <PencilLine className="h-4 w-4" />
                    Yetki
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                    disabled={!canDelete}
                    title={deleteDisabledReason ?? undefined}
                    onClick={onOpenDeleteDialog}
                >
                    <Trash2 className="h-4 w-4" />
                    Sil
                </Button>
                {isDirty ? (
                    <Button type="button" size="sm" disabled={isSaving || Boolean(validationError)} onClick={onSave}>
                        {isSaving ? <Spinner className="size-4" /> : <Save className="h-4 w-4" />}
                        Kaydet
                    </Button>
                ) : (
                    <div className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-neutral-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Güncel
                    </div>
                )}
            </div>

            {validationError ? (
                <p className="mt-2 text-[11px] leading-4 text-rose-600">{validationError}</p>
            ) : null}
        </div>
    )
}
