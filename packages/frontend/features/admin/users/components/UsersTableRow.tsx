"use client"

import { CheckCircle2, Eye, PencilLine, Save, Trash2, UserPen } from "lucide-react"
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
    formatUserDateShort,
    getCustomerContactMeta,
    getInitials,
    getPortalLinkSummary,
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

const COMPACT_ACTION_BUTTON_CLASS = "h-8 justify-start rounded-xl px-2.5 text-[11px] font-medium shadow-none"

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

function SummaryPill({ label }: { label: string }) {
    return (
        <Badge
            variant="outline"
            className="rounded-full border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
        >
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
    const effective = getEffectiveDraft(user, draft)
    const portalSummary = getPortalLinkSummary(user, draft, suppliers, customers)
    const roleLabel = GROUP_LABELS[(draft?.group ?? getUserDisplayGroup(user))]
    const status = draft?.accessStatus ?? user.accessStatus
    const customerMeta = getCustomerContactMeta(user)

    return (
        <TableRow className="border-neutral-200/70 bg-white hover:bg-neutral-50/80">
            <TableCell className="w-[250px] whitespace-normal py-4 pl-5 align-top">
                <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} onCheckedChange={onToggleSelected} className="mt-0.5" />
                    <Avatar size="lg" className="size-11 ring-1 ring-neutral-200/80">
                        <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-1.5">
                        <div className="space-y-0.5">
                            <div className="truncate text-sm font-semibold leading-5 text-neutral-950">{displayName}</div>
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

            <TableCell className="w-[160px] whitespace-normal py-4 align-top">
                <div className="space-y-1.5">
                    <Badge
                        variant="outline"
                        className="max-w-full whitespace-normal rounded-2xl border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] leading-4 text-neutral-700"
                    >
                        {roleLabel}
                    </Badge>
                    <UserAccessStatusBadge status={status} />
                </div>
            </TableCell>

            <TableCell className="w-[190px] whitespace-normal py-4 align-top">
                <div className="grid gap-2 text-sm text-neutral-700">
                    <div className="space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">Tedarikçi</div>
                        <div className="truncate text-[13px] font-medium text-neutral-800">{portalSummary.supplierName ?? "Bağ yok"}</div>
                    </div>
                    <div className="space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">Müşteri</div>
                        <div className="truncate text-[13px] font-medium text-neutral-800">{portalSummary.customerName ?? "Bağ yok"}</div>
                    </div>
                </div>
            </TableCell>

            <TableCell className="w-[130px] whitespace-normal py-4 align-top">
                <div className="space-y-1 text-sm text-neutral-700">
                    <div className="font-medium text-neutral-900">{formatUserDateShort(user.updatedAt)}</div>
                    <div className="text-[11px] leading-4 text-neutral-500">Kayıt: {formatUserDateShort(user.createdAt)}</div>
                </div>
            </TableCell>

            <TableCell className="w-[220px] whitespace-normal py-4 pr-5 align-top text-right">
                <div className="ml-auto grid max-w-[200px] gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="ghost" size="sm" className={COMPACT_ACTION_BUTTON_CLASS} onClick={onOpenDetails}>
                            <Eye className="h-4 w-4" />
                            Detay
                        </Button>
                        <Button type="button" variant="outline" size="sm" className={COMPACT_ACTION_BUTTON_CLASS} onClick={onOpenProfileEditor}>
                            <UserPen className="h-4 w-4" />
                            Profil
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" size="sm" className={COMPACT_ACTION_BUTTON_CLASS} onClick={onOpenAccessEditor}>
                            <PencilLine className="h-4 w-4" />
                            Yetki
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`${COMPACT_ACTION_BUTTON_CLASS} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800`}
                            disabled={!canDelete}
                            title={deleteDisabledReason ?? undefined}
                            onClick={onOpenDeleteDialog}
                        >
                            <Trash2 className="h-4 w-4" />
                            Sil
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {isDirty ? (
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 rounded-xl px-2.5 text-[11px] font-medium"
                                disabled={isSaving || Boolean(validationError)}
                                onClick={onSave}
                            >
                                {isSaving ? <Spinner className="size-4" /> : <Save className="h-4 w-4" />}
                                Kaydet
                            </Button>
                        ) : (
                            <div className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 text-[11px] font-medium text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Güncel
                            </div>
                        )}
                    </div>

                    {validationError ? (
                        <p className="text-right text-[11px] leading-4 text-rose-600">{validationError}</p>
                    ) : isDirty ? (
                        <p className="text-right text-[11px] text-amber-600">Kaydedilmemiş değişiklik var.</p>
                    ) : null}
                </div>
            </TableCell>
        </TableRow>
    )
}
