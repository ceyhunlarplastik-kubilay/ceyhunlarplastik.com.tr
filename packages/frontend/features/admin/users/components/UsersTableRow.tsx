"use client"

import { CheckCircle2, Eye, PencilLine, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
    TableCell,
    TableRow,
} from "@/components/ui/table"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import {
    getPortalLinkSummary,
    getUserAssignmentSummary,
    getCustomerContactMeta,
    getInitials,
    formatUserDateShort,
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
    onOpenAccessEditor: () => void
    onSave: () => void
}

function SummaryPill({ label }: { label: string }) {
    return (
        <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
            {label}
        </Badge>
    )
}

export function UsersTableRow({
    user,
    draft,
    suppliers,
    customers,
    isSaving,
    isSelected,
    onToggleSelected,
    onOpenDetails,
    onOpenAccessEditor,
    onSave,
}: Props) {
    const displayName = getUserDisplayName(user) || user.email
    const isDirty = isUserDraftDirty(user, draft)
    const validationError = validateUserDraft(user, draft)
    const effective = getEffectiveDraft(user, draft)
    const portalSummary = getPortalLinkSummary(user, draft, suppliers, customers)
    const assignmentSummary = getUserAssignmentSummary(user, draft)
    const roleLabel = GROUP_LABELS[(draft?.group ?? getUserDisplayGroup(user))]
    const status = draft?.accessStatus ?? user.accessStatus
    const customerMeta = getCustomerContactMeta(user)

    return (
        <TableRow className="border-neutral-100 hover:bg-neutral-50/70">
            <TableCell className="w-[320px] py-4">
                <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} onCheckedChange={onToggleSelected} className="mt-1" />
                    <Avatar size="lg" className="ring-1 ring-neutral-200">
                        <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-2">
                        <div className="space-y-1">
                            <div className="truncate text-sm font-semibold text-neutral-950">{displayName}</div>
                            <div className="truncate text-xs text-neutral-500">{user.email}</div>
                            <div className="truncate text-xs text-neutral-400">@{user.identifier}</div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {!user.isActive ? <SummaryPill label="Pasif" /> : null}
                            {isDirty ? <SummaryPill label="Taslak" /> : null}
                            {portalSummary.supplierName ? <SummaryPill label="Tedarikçi Portalı" /> : null}
                            {portalSummary.customerName ? <SummaryPill label="Müşteri Portalı" /> : null}
                        </div>

                        {effective.customerId === user.customerId && customerMeta ? (
                            <div className="truncate text-[11px] text-neutral-500">{customerMeta}</div>
                        ) : null}
                    </div>
                </div>
            </TableCell>

            <TableCell className="w-[190px] py-4">
                <div className="space-y-2">
                    <Badge variant="outline" className="rounded-full border-neutral-200 bg-white text-neutral-700">
                        {roleLabel}
                    </Badge>
                    <UserAccessStatusBadge status={status} />
                </div>
            </TableCell>

            <TableCell className="w-[260px] py-4">
                <div className="space-y-2 text-sm text-neutral-700">
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Tedarikçi</div>
                        <div className="truncate">{portalSummary.supplierName ?? "Bağ yok"}</div>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Müşteri</div>
                        <div className="truncate">{portalSummary.customerName ?? "Bağ yok"}</div>
                    </div>
                </div>
            </TableCell>

            <TableCell className="w-[200px] py-4">
                <div className="space-y-2 text-sm text-neutral-700">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                        <span>Satış</span>
                        <span className="font-semibold text-neutral-950">{assignmentSummary.salesCount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                        <span>Satın alma</span>
                        <span className="font-semibold text-neutral-950">{assignmentSummary.purchasingCount}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell className="w-[160px] py-4">
                <div className="space-y-1 text-sm text-neutral-700">
                    <div>{formatUserDateShort(user.updatedAt)}</div>
                    <div className="text-xs text-neutral-500">Kayıt: {formatUserDateShort(user.createdAt)}</div>
                </div>
            </TableCell>

            <TableCell className="w-[190px] py-4 text-right">
                <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={onOpenDetails}>
                            <Eye className="h-4 w-4" />
                            Detay
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={onOpenAccessEditor}>
                            <PencilLine className="h-4 w-4" />
                            Düzenle
                        </Button>
                        {isDirty ? (
                            <Button type="button" size="sm" disabled={isSaving || Boolean(validationError)} onClick={onSave}>
                                {isSaving ? <Spinner className="size-4" /> : <Save className="h-4 w-4" />}
                                Kaydet
                            </Button>
                        ) : null}
                    </div>

                    {validationError ? (
                        <p className="max-w-44 text-right text-[11px] leading-4 text-rose-600">{validationError}</p>
                    ) : isDirty ? (
                        <p className="text-[11px] text-amber-600">Kaydedilmemiş değişiklik var.</p>
                    ) : (
                        <p className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Güncel
                        </p>
                    )}
                </div>
            </TableCell>
        </TableRow>
    )
}
