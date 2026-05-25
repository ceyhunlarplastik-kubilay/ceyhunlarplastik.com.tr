"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import {
    ArrowUpDown,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    ChevronDown,
    Filter,
    Save,
    ShieldCheck,
    Users,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import { useCustomers } from "@/features/admin/customers/hooks/useCustomers"
import { useUpdateUserProfile } from "@/features/admin/users/hooks/useUpdateUserProfile"
import { useUpdateUserSupplier } from "@/features/admin/users/hooks/useUpdateUserSupplier"
import { useUpdateUserRole } from "@/features/admin/users/hooks/useUpdateUserRole"
import { useUserListFilters } from "@/features/admin/users/hooks/useUserListFilters"
import { UserListFilters } from "@/features/admin/users/components/UserListFilters"
import { UserEditDialog } from "@/features/admin/users/components/UserEditDialog"
import { EntityAssignmentSelect } from "@/features/admin/users/components/EntityAssignmentSelect"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import type { AdminUser } from "@/features/admin/users/api/types"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import {
    ACCESS_STATUS_OPTIONS,
    buildUserEditorSubmission,
    type AccessStatus,
    type CustomerOption,
    getDefaultAccessStatusForGroup,
    getRoleOptions,
    getUserDisplayGroup,
    GROUP_LABELS,
    ROLE_ASSIGNMENT_CONFIG,
    type UserEditorFormValues,
    type UserGroup,
} from "@/features/admin/users/schema/userEditor"
import { getUserDisplayName } from "@/lib/users/displayName"

const EMPTY_OPTION = "__none__"
const USER_CELL_BADGE_CLASS = "rounded-full border-neutral-200 bg-white/80 text-neutral-700"
const USERS_QUICK_FILTERS_STORAGE_KEY = "admin-users-quick-filters-v1"
const EMPTY_USERS: AdminUser[] = []
const EMPTY_SUPPLIERS: Supplier[] = []
const EMPTY_CUSTOMERS: CustomerOption[] = []

type UserDraft = {
    group?: UserGroup
    accessStatus?: AccessStatus
    supplierId?: string | null
    customerId?: string | null
    assignedSupplierIds?: string[]
    assignedCustomerIds?: string[]
}

type QuickRoleFilter = "all" | UserGroup
type QuickLinkFilter = "all" | "portal_supplier" | "portal_customer" | "unlinked"
type QuickStateFilter = "all" | "dirty" | "inactive"
type SortKey = "createdAt" | "email" | "role" | "status"
type SortDirection = "asc" | "desc"

const QUICK_ROLE_CHIPS: Array<{ value: QuickRoleFilter; label: string }> = [
    { value: "all", label: "Tüm Roller" },
    { value: "purchasing", label: "Satın Alma" },
    { value: "sales", label: "Satış" },
    { value: "supplier", label: "Tedarikçi" },
    { value: "customer", label: "Müşteri Portalı" },
]

const QUICK_LINK_CHIPS: Array<{ value: QuickLinkFilter; label: string; icon: typeof Building2 }> = [
    { value: "all", label: "Tüm Bağlar", icon: Building2 },
    { value: "portal_supplier", label: "Portal Tedarikçi", icon: Building2 },
    { value: "portal_customer", label: "Portal Müşteri", icon: BriefcaseBusiness },
    { value: "unlinked", label: "Bağsız Kullanıcı", icon: ShieldCheck },
]

const QUICK_STATE_CHIPS: Array<{ value: QuickStateFilter; label: string }> = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "dirty", label: "Değişiklik Bekleyen" },
    { value: "inactive", label: "Pasif" },
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: "createdAt", label: "Kayıt Tarihi" },
    { value: "email", label: "E-posta" },
    { value: "role", label: "Rol" },
    { value: "status", label: "Erişim Durumu" },
]

type UsersQuickFiltersPersisted = {
    quickRole: QuickRoleFilter
    quickLink: QuickLinkFilter
    quickState: QuickStateFilter
    sortKey: SortKey
    sortDirection: SortDirection
}

function readPersistedQuickFilters(): UsersQuickFiltersPersisted {
    if (typeof window === "undefined") {
        return {
            quickRole: "all",
            quickLink: "all",
            quickState: "all",
            sortKey: "createdAt",
            sortDirection: "desc",
        }
    }

    try {
        const raw = window.localStorage.getItem(USERS_QUICK_FILTERS_STORAGE_KEY)
        if (!raw) {
            return {
                quickRole: "all",
                quickLink: "all",
                quickState: "all",
                sortKey: "createdAt",
                sortDirection: "desc",
            }
        }

        const parsed = JSON.parse(raw) as Partial<UsersQuickFiltersPersisted>

        return {
            quickRole: parsed.quickRole ?? "all",
            quickLink: parsed.quickLink ?? "all",
            quickState: parsed.quickState ?? "all",
            sortKey: parsed.sortKey ?? "createdAt",
            sortDirection: parsed.sortDirection ?? "desc",
        }
    } catch {
        return {
            quickRole: "all",
            quickLink: "all",
            quickState: "all",
            sortKey: "createdAt",
            sortDirection: "desc",
        }
    }
}

function getInitials(user: Pick<AdminUser, "identifier" | "email">) {
    const source = getUserDisplayName(user) || user.email || "??"
    return source.slice(0, 2).toUpperCase()
}

function formatUserDate(value?: string | null) {
    if (!value) return "Bilgi yok"

    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value))
}

function uniqueSorted(values: string[]) {
    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "tr"))
}

function areStringArraysEqual(left: string[], right: string[]) {
    const leftSorted = uniqueSorted(left)
    const rightSorted = uniqueSorted(right)

    if (leftSorted.length !== rightSorted.length) return false
    return leftSorted.every((value, index) => value === rightSorted[index])
}

function getEffectiveDraft(user: AdminUser, draft: UserDraft | undefined) {
    const group = draft?.group ?? getUserDisplayGroup(user)
    const accessStatus = draft?.accessStatus ?? user.accessStatus
    const supplierId = draft?.supplierId !== undefined ? draft.supplierId : (user.supplierId ?? null)
    const customerId = draft?.customerId !== undefined ? draft.customerId : (user.customerId ?? null)
    const assignedSupplierIds = draft?.assignedSupplierIds ?? (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id)
    const assignedCustomerIds = draft?.assignedCustomerIds ?? (user.assignedSalesCustomers ?? []).map((customer) => customer.id)

    return {
        group,
        accessStatus,
        supplierId,
        customerId,
        assignedSupplierIds,
        assignedCustomerIds,
    }
}

function isUserDraftDirty(user: AdminUser, draft: UserDraft | undefined) {
    if (!draft) return false

    const effective = getEffectiveDraft(user, draft)

    return (
        effective.group !== getUserDisplayGroup(user)
        || effective.accessStatus !== user.accessStatus
        || effective.supplierId !== (user.supplierId ?? null)
        || effective.customerId !== (user.customerId ?? null)
        || !areStringArraysEqual(effective.assignedSupplierIds, (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id))
        || !areStringArraysEqual(effective.assignedCustomerIds, (user.assignedSalesCustomers ?? []).map((customer) => customer.id))
    )
}

function buildUserUpdatePayload(user: AdminUser, draft: UserDraft | undefined) {
    const effective = getEffectiveDraft(user, draft)
    const roleConfig = ROLE_ASSIGNMENT_CONFIG[effective.group]
    const normalizedSupplierId = roleConfig.requiresPortalSupplier ? (effective.supplierId ?? null) : null
    const normalizedCustomerId = roleConfig.requiresPortalCustomer ? (effective.customerId ?? null) : null
    const normalizedAssignedSupplierIds = roleConfig.canAssignSuppliers ? uniqueSorted(effective.assignedSupplierIds) : []
    const normalizedAssignedCustomerIds = roleConfig.canAssignCustomers ? uniqueSorted(effective.assignedCustomerIds) : []

    return {
        group: effective.group,
        accessStatus: effective.accessStatus,
        supplierId: normalizedSupplierId,
        customerId: normalizedCustomerId,
        assignedSupplierIds: normalizedAssignedSupplierIds,
        assignedCustomerIds: normalizedAssignedCustomerIds,
        roleChanged:
            effective.group !== getUserDisplayGroup(user)
            || effective.accessStatus !== user.accessStatus
            || normalizedSupplierId !== (user.supplierId ?? null)
            || normalizedCustomerId !== (user.customerId ?? null),
        assignmentsChanged:
            normalizedSupplierId !== (user.supplierId ?? null)
            || normalizedCustomerId !== (user.customerId ?? null)
            || !areStringArraysEqual(normalizedAssignedSupplierIds, (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id))
            || !areStringArraysEqual(normalizedAssignedCustomerIds, (user.assignedSalesCustomers ?? []).map((customer) => customer.id)),
    }
}

function validateUserDraft(user: AdminUser, draft: UserDraft | undefined) {
    const payload = buildUserUpdatePayload(user, draft)
    const config = ROLE_ASSIGNMENT_CONFIG[payload.group]

    if (config.requiresPortalSupplier && !payload.supplierId) {
        return "Tedarikçi rolü için bir portal tedarikçi seçmelisiniz."
    }

    if (config.requiresPortalCustomer && !payload.customerId) {
        return "Müşteri portalı rolü için bir portal müşteri seçmelisiniz."
    }

    return null
}

function matchesQuickFilters(
    user: AdminUser,
    draft: UserDraft | undefined,
    quickRole: QuickRoleFilter,
    quickLink: QuickLinkFilter,
    quickState: QuickStateFilter,
) {
    const effective = getEffectiveDraft(user, draft)

    if (quickRole !== "all" && effective.group !== quickRole) {
        return false
    }

    if (quickLink === "portal_supplier" && !effective.supplierId) {
        return false
    }

    if (quickLink === "portal_customer" && !effective.customerId) {
        return false
    }

    if (quickLink === "unlinked" && (effective.supplierId || effective.customerId)) {
        return false
    }

    if (quickState === "dirty" && !isUserDraftDirty(user, draft)) {
        return false
    }

    if (quickState === "inactive" && user.isActive) {
        return false
    }

    return true
}

function sortUsers(
    users: AdminUser[],
    draftsByUserId: Record<string, UserDraft>,
    sortKey: SortKey,
    sortDirection: SortDirection,
) {
    const direction = sortDirection === "asc" ? 1 : -1

    return [...users].sort((left, right) => {
        const leftDraft = draftsByUserId[left.id]
        const rightDraft = draftsByUserId[right.id]
        const leftEffective = getEffectiveDraft(left, leftDraft)
        const rightEffective = getEffectiveDraft(right, rightDraft)

        const leftValue =
            sortKey === "email" ? left.email :
            sortKey === "role" ? GROUP_LABELS[leftEffective.group] :
            sortKey === "status" ? leftEffective.accessStatus :
            left.createdAt

        const rightValue =
            sortKey === "email" ? right.email :
            sortKey === "role" ? GROUP_LABELS[rightEffective.group] :
            sortKey === "status" ? rightEffective.accessStatus :
            right.createdAt

        return String(leftValue).localeCompare(String(rightValue), "tr") * direction
    })
}

function getUsersStats(users: AdminUser[], draftsByUserId: Record<string, UserDraft>) {
    return users.reduce(
        (acc, user) => {
            const effective = getEffectiveDraft(user, draftsByUserId[user.id])
            if (effective.group === "purchasing") acc.purchasing += 1
            if (effective.group === "sales") acc.sales += 1
            if (effective.group === "supplier") acc.suppliers += 1
            if (effective.group === "customer") acc.customers += 1
            if (isUserDraftDirty(user, draftsByUserId[user.id])) acc.dirty += 1
            if (!user.isActive) acc.inactive += 1
            return acc
        },
        { purchasing: 0, sales: 0, suppliers: 0, customers: 0, dirty: 0, inactive: 0 },
    )
}

function getCustomerContactMeta(user: AdminUser) {
    const parts = [user.customerContactTitle, user.customerContactDepartment]
        .map((value) => value?.trim())
        .filter(Boolean)

    if (parts.length === 0) {
        return user.isPrimaryCustomerContact ? "Ana Yetkili" : ""
    }

    const meta = parts.join(" / ")
    return user.isPrimaryCustomerContact ? `${meta} / Ana Yetkili` : meta
}

function useUserAccessUpdate() {
    const updateUserProfile = useUpdateUserProfile()
    const updateUserRole = useUpdateUserRole()
    const updateUserSupplier = useUpdateUserSupplier()

    return {
        async saveDraft(user: AdminUser, draft: UserDraft | undefined) {
            const payload = buildUserUpdatePayload(user, draft)

            if (payload.roleChanged) {
                await updateUserRole.mutateAsync({
                    id: user.id,
                    group: payload.group,
                    accessStatus: payload.accessStatus,
                    supplierId: payload.supplierId,
                    customerId: payload.customerId,
                    reason: null,
                })
            }

            if (payload.assignmentsChanged) {
                await updateUserSupplier.mutateAsync({
                    id: user.id,
                    supplierId: payload.supplierId,
                    customerId: payload.customerId,
                    assignedSupplierIds: payload.assignedSupplierIds,
                    assignedCustomerIds: payload.assignedCustomerIds,
                })
            }

            return payload
        },
        async saveEditor(user: AdminUser, values: UserEditorFormValues) {
            const payload = buildUserEditorSubmission(user, values)

            if (payload.roleChanged) {
                await updateUserRole.mutateAsync(payload.rolePayload)
            }

            if (payload.assignmentsChanged) {
                await updateUserSupplier.mutateAsync(payload.assignmentPayload)
            }

            if (payload.profileChanged) {
                await updateUserProfile.mutateAsync(payload.profilePayload)
            }

            return payload
        },
    }
}

function UsersTableLoadingRow() {
    return (
        <TableRow>
            <TableCell colSpan={6} className="py-20">
                <div className="space-y-3 px-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="grid animate-pulse gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4 md:grid-cols-[240px_repeat(4,minmax(180px,1fr))_120px]"
                        >
                            <div className="h-12 rounded-2xl bg-neutral-200/80" />
                            <div className="h-24 rounded-2xl bg-neutral-200/70" />
                            <div className="h-24 rounded-2xl bg-neutral-200/70" />
                            <div className="h-24 rounded-2xl bg-neutral-200/70" />
                            <div className="h-24 rounded-2xl bg-neutral-200/70" />
                            <div className="h-12 rounded-2xl bg-neutral-200/80" />
                        </div>
                    ))}
                </div>
            </TableCell>
        </TableRow>
    )
}

function UsersTableEmptyRow() {
    return (
        <TableRow>
            <TableCell colSpan={6} className="py-20">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-500">
                        Sonuc bulunamadi
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-700">Filtrelere uygun kullanıcı bulunamadı.</p>
                        <p className="text-xs text-neutral-500">Arama veya erişim filtresini genişletip tekrar deneyin.</p>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    )
}

function UserRoleCell({
    user,
    group,
    isOwnerViewer,
    onGroupChange,
}: {
    user: AdminUser
    group: UserGroup
    isOwnerViewer: boolean
    onGroupChange: (group: UserGroup) => void
}) {
    const options = getRoleOptions(user, isOwnerViewer)
    const roleSelectDisabled = !isOwnerViewer && ["admin", "owner"].includes(getUserDisplayGroup(user))

    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Yetki Grubu
            </div>
            <Select disabled={roleSelectDisabled} value={group} onValueChange={(value) => onGroupChange(value as UserGroup)}>
                <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Rol seç" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-1.5">
                {user.groups.map((currentGroup) => (
                    <Badge key={`${user.id}-${currentGroup}`} variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                        {GROUP_LABELS[currentGroup as UserGroup] ?? currentGroup}
                    </Badge>
                ))}
            </div>
        </div>
    )
}

function UserAccessStatusCell({
    status,
    onStatusChange,
}: {
    status: AccessStatus
    onStatusChange: (status: AccessStatus) => void
}) {
    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Erişim Durumu
            </div>
            <UserAccessStatusBadge status={status} />
            <Select value={status} onValueChange={(value) => onStatusChange(value as AccessStatus)}>
                <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Durum seç" />
                </SelectTrigger>
                <SelectContent>
                    {ACCESS_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function UserPortalLinksCell({
    group,
    supplierId,
    customerId,
    suppliers,
    customers,
    isLoadingSuppliers,
    isLoadingCustomers,
    onSupplierChange,
    onCustomerChange,
}: {
    group: UserGroup
    supplierId: string | null
    customerId: string | null
    suppliers: Supplier[]
    customers: CustomerOption[]
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    onSupplierChange: (value: string | null) => void
    onCustomerChange: (value: string | null) => void
}) {
    const roleConfig = ROLE_ASSIGNMENT_CONFIG[group]

    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3">
            <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Portal Tedarikçi
                </div>
                <Select
                    disabled={!roleConfig.requiresPortalSupplier || isLoadingSuppliers}
                    value={supplierId ?? EMPTY_OPTION}
                    onValueChange={(value) => onSupplierChange(value === EMPTY_OPTION ? null : value)}
                >
                    <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Atama yok" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={EMPTY_OPTION}>Atama yok</SelectItem>
                        {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Portal Müşteri
                </div>
                <Select
                    disabled={!roleConfig.requiresPortalCustomer || isLoadingCustomers}
                    value={customerId ?? EMPTY_OPTION}
                    onValueChange={(value) => onCustomerChange(value === EMPTY_OPTION ? null : value)}
                >
                    <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Atama yok" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={EMPTY_OPTION}>Atama yok</SelectItem>
                        {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                                {customer.companyName || customer.fullName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

function UserOperationalAssignmentsCell({
    group,
    assignedSupplierIds,
    assignedCustomerIds,
    suppliers,
    customers,
    isLoadingSuppliers,
    isLoadingCustomers,
    onAssignedSupplierIdsChange,
    onAssignedCustomerIdsChange,
}: {
    group: UserGroup
    assignedSupplierIds: string[]
    assignedCustomerIds: string[]
    suppliers: Supplier[]
    customers: CustomerOption[]
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    onAssignedSupplierIdsChange: (value: string[]) => void
    onAssignedCustomerIdsChange: (value: string[]) => void
}) {
    const roleConfig = ROLE_ASSIGNMENT_CONFIG[group]

    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3">
            <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Satın Alma Atamaları
                </div>
                <EntityAssignmentSelect
                    disabled={!roleConfig.canAssignSuppliers || isLoadingSuppliers}
                    value={assignedSupplierIds}
                    options={suppliers.map((supplier) => ({
                        id: supplier.id,
                        label: supplier.name,
                        caption: supplier.contactName || supplier.taxNumber || undefined,
                    }))}
                    placeholder="Tedarikçi seç"
                    emptyLabel="Tedarikçi bulunamadı"
                    onChange={onAssignedSupplierIdsChange}
                />
            </div>

            <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Satış Atamaları
                </div>
                <EntityAssignmentSelect
                    disabled={!roleConfig.canAssignCustomers || isLoadingCustomers}
                    value={assignedCustomerIds}
                    options={customers.map((customer) => ({
                        id: customer.id,
                        label: customer.companyName || customer.fullName,
                        caption: customer.fullName,
                    }))}
                    placeholder="Müşteri seç"
                    emptyLabel="Müşteri bulunamadı"
                    onChange={onAssignedCustomerIdsChange}
                />
            </div>
        </div>
    )
}

function UserSaveButton({
    canSave,
    isSaving,
    onSave,
}: {
    canSave: boolean
    isSaving: boolean
    onSave: () => void
}) {
    return (
        <Button
            size="sm"
            type="button"
            variant={canSave ? "default" : "outline"}
            className="min-w-28 gap-2 rounded-xl"
            disabled={!canSave || isSaving}
            onClick={onSave}
        >
            {isSaving ? <Spinner className="size-4" /> : canSave ? <Save className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {isSaving ? "Kaydediliyor" : canSave ? "Kaydet" : "Güncel"}
        </Button>
    )
}

function UserExpandedPanel({
    user,
    draft,
}: {
    user: AdminUser
    draft: UserDraft | undefined
}) {
    const effective = getEffectiveDraft(user, draft)

    return (
        <div className="grid gap-4 rounded-[24px] border border-neutral-200 bg-[linear-gradient(180deg,rgba(250,250,250,0.9),rgba(255,255,255,1))] p-4 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white/90 p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Kimlik Bilgileri</div>
                <div className="space-y-1 text-sm text-neutral-700">
                    <div><span className="font-medium text-neutral-900">Kayıt:</span> {formatUserDate(user.createdAt)}</div>
                    <div><span className="font-medium text-neutral-900">Güncelleme:</span> {formatUserDate(user.updatedAt)}</div>
                    <div><span className="font-medium text-neutral-900">Son erişim kararı:</span> {formatUserDate(user.accessStatusChangedAt)}</div>
                </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white/90 p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Aktif Bağlantılar</div>
                <div className="space-y-2 text-sm text-neutral-700">
                    <div><span className="font-medium text-neutral-900">Rol:</span> {GROUP_LABELS[effective.group]}</div>
                    <div><span className="font-medium text-neutral-900">Portal tedarikçi:</span> {user.supplier?.name ?? "Atama yok"}</div>
                    <div><span className="font-medium text-neutral-900">Portal müşteri:</span> {user.customer?.companyName || user.customer?.fullName || "Atama yok"}</div>
                    {user.customer ? (
                        <div><span className="font-medium text-neutral-900">Müşteri iletişim kartı:</span> {getCustomerContactMeta(user) || "Tanımlanmadı"}</div>
                    ) : null}
                </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white/90 p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Operasyon Özeti</div>
                <div className="space-y-2 text-sm text-neutral-700">
                    <div><span className="font-medium text-neutral-900">Satın alma ataması:</span> {effective.assignedSupplierIds.length} kayıt</div>
                    <div><span className="font-medium text-neutral-900">Satış ataması:</span> {effective.assignedCustomerIds.length} kayıt</div>
                    <div><span className="font-medium text-neutral-900">Erişim:</span> {effective.accessStatus}</div>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    tone = "neutral",
}: {
    label: string
    value: number
    tone?: "neutral" | "accent" | "warning"
}) {
    return (
        <div
            className={cn(
                "rounded-[22px] border p-4 shadow-sm",
                tone === "accent" && "border-sky-200 bg-sky-50/80",
                tone === "warning" && "border-amber-200 bg-amber-50/80",
                tone === "neutral" && "border-neutral-200 bg-white/90",
            )}
        >
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-950">{value}</div>
        </div>
    )
}

function UsersStatsStrip({
    users,
    draftsByUserId,
}: {
    users: AdminUser[]
    draftsByUserId: Record<string, UserDraft>
}) {
    const stats = useMemo(() => getUsersStats(users, draftsByUserId), [draftsByUserId, users])

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Satın Alma" value={stats.purchasing} />
            <StatCard label="Satış" value={stats.sales} />
            <StatCard label="Tedarikçi" value={stats.suppliers} />
            <StatCard label="Müşteri Portalı" value={stats.customers} tone="accent" />
            <StatCard label="Bekleyen Değişiklik" value={stats.dirty} tone="warning" />
            <StatCard label="Pasif Kullanıcı" value={stats.inactive} />
        </div>
    )
}

function UsersBulkActions({
    selectedCount,
    compareDisabled,
    onClearSelection,
    onExpandSelection,
    onCompare,
    onSaveSelection,
}: {
    selectedCount: number
    compareDisabled: boolean
    onClearSelection: () => void
    onExpandSelection: () => void
    onCompare: () => void
    onSaveSelection: () => void
}) {
    if (selectedCount === 0) return null

    return (
        <div className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 bg-white/90 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-950">{selectedCount}</span> kullanıcı seçildi.
            </div>

            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={onExpandSelection}>
                    Detayları Aç
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" disabled={compareDisabled} onClick={onCompare}>
                    Karşılaştır
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={onSaveSelection}>
                    Seçilileri Kaydet
                </Button>
                <Button type="button" variant="ghost" className="rounded-xl" onClick={onClearSelection}>
                    Seçimi Temizle
                </Button>
            </div>
        </div>
    )
}

function UserComparisonDialog({
    open,
    onOpenChange,
    users,
    draftsByUserId,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    users: AdminUser[]
    draftsByUserId: Record<string, UserDraft>
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto rounded-[28px] border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] p-6">
                    <DialogHeader>
                        <DialogTitle>Kullanıcı Karşılaştırma Modu</DialogTitle>
                        <DialogDescription>
                            Seçili kullanıcıların aktif rol, erişim ve operasyon bağlantılarını yan yana inceleyin.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-2">
                    {users.map((user) => {
                        const effective = getEffectiveDraft(user, draftsByUserId[user.id])
                        const displayName = getUserDisplayName(user) || user.email
                        return (
                            <div key={user.id} className="space-y-4 rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Avatar size="lg" className="ring-1 ring-neutral-200">
                                        <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-neutral-950">{displayName}</div>
                                        <div className="truncate text-xs text-neutral-500">{user.email}</div>
                                        <div className="truncate text-xs text-neutral-500">@{user.identifier}</div>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-700">
                                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Erişim</div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <UserAccessStatusBadge status={effective.accessStatus} />
                                            <Badge variant="outline" className={USER_CELL_BADGE_CLASS}>{GROUP_LABELS[effective.group]}</Badge>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-700">
                                        <div><span className="font-medium text-neutral-900">Portal tedarikçi:</span> {user.supplier?.name ?? "Atama yok"}</div>
                                        <div><span className="font-medium text-neutral-900">Portal müşteri:</span> {user.customer?.companyName || user.customer?.fullName || "Atama yok"}</div>
                                        {user.customer ? (
                                            <div><span className="font-medium text-neutral-900">İletişim meta verisi:</span> {getCustomerContactMeta(user) || "Tanımlanmadı"}</div>
                                        ) : null}
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-700">
                                        <div><span className="font-medium text-neutral-900">Satın alma atamaları:</span> {effective.assignedSupplierIds.length}</div>
                                        <div><span className="font-medium text-neutral-900">Satış atamaları:</span> {effective.assignedCustomerIds.length}</div>
                                        <div><span className="font-medium text-neutral-900">Kayıt tarihi:</span> {formatUserDate(user.createdAt)}</div>
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

function UserTableRow({
    user,
    draft,
    suppliers,
    customers,
    isOwnerViewer,
    isSaving,
    isLoadingSuppliers,
    isLoadingCustomers,
    isExpanded,
    isSelected,
    onToggleExpand,
    onToggleSelected,
    onDraftChange,
    onSave,
    onOpenEditor,
}: {
    user: AdminUser
    draft: UserDraft | undefined
    suppliers: Supplier[]
    customers: CustomerOption[]
    isOwnerViewer: boolean
    isSaving: boolean
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    isExpanded: boolean
    isSelected: boolean
    onToggleExpand: () => void
    onToggleSelected: () => void
    onDraftChange: (patch: UserDraft) => void
    onSave: () => void
    onOpenEditor: () => void
}) {
    const effective = getEffectiveDraft(user, draft)
    const isDirty = isUserDraftDirty(user, draft)
    const validationError = validateUserDraft(user, draft)
    const canSave = isDirty && !validationError
    const displayName = getUserDisplayName(user) || user.email

    return (
        <>
            <TableRow className="border-neutral-100 transition-colors hover:bg-neutral-50/80">
            <TableCell className="sticky left-0 z-20 align-top bg-white py-5 shadow-[8px_0_18px_-18px_rgba(15,23,42,0.32)]">
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
                            <div className="truncate text-xs text-neutral-500">@{user.identifier}</div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {user.supplier ? <Badge variant="outline" className={USER_CELL_BADGE_CLASS}>Tedarikçi Portalı</Badge> : null}
                            {user.customer ? <Badge variant="outline" className={USER_CELL_BADGE_CLASS}>Müşteri Portalı</Badge> : null}
                            {!user.isActive ? <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">Pasif</Badge> : null}
                        </div>
                        {user.customer ? (
                            <div className="truncate text-[11px] text-neutral-500">
                                {getCustomerContactMeta(user) || "Müşteri iletişim meta verisi eklenmedi"}
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={onToggleExpand}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
                        >
                            Detay
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                        </button>
                    </div>
                </div>
            </TableCell>

            <TableCell className="align-top py-5">
                <UserRoleCell
                    user={user}
                    group={effective.group}
                    isOwnerViewer={isOwnerViewer}
                    onGroupChange={(group) => onDraftChange({
                        group,
                        accessStatus: getDefaultAccessStatusForGroup(group),
                    })}
                />
            </TableCell>

            <TableCell className="align-top py-5">
                <UserAccessStatusCell
                    status={effective.accessStatus}
                    onStatusChange={(accessStatus) => onDraftChange({ accessStatus })}
                />
            </TableCell>

            <TableCell className="align-top py-5">
                <UserPortalLinksCell
                    group={effective.group}
                    supplierId={effective.supplierId}
                    customerId={effective.customerId}
                    suppliers={suppliers}
                    customers={customers}
                    isLoadingSuppliers={isLoadingSuppliers}
                    isLoadingCustomers={isLoadingCustomers}
                    onSupplierChange={(supplierId) => onDraftChange({ supplierId })}
                    onCustomerChange={(customerId) => onDraftChange({ customerId })}
                />
            </TableCell>

            <TableCell className="align-top py-5">
                <UserOperationalAssignmentsCell
                    group={effective.group}
                    assignedSupplierIds={effective.assignedSupplierIds}
                    assignedCustomerIds={effective.assignedCustomerIds}
                    suppliers={suppliers}
                    customers={customers}
                    isLoadingSuppliers={isLoadingSuppliers}
                    isLoadingCustomers={isLoadingCustomers}
                    onAssignedSupplierIdsChange={(assignedSupplierIds) => onDraftChange({ assignedSupplierIds })}
                    onAssignedCustomerIdsChange={(assignedCustomerIds) => onDraftChange({ assignedCustomerIds })}
                />
            </TableCell>

            <TableCell className="align-top py-5 text-right">
                <div className="flex flex-col items-end gap-2">
                    <UserSaveButton canSave={canSave} isSaving={isSaving} onSave={onSave} />
                    <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={onOpenEditor}>
                        Profili Düzenle
                    </Button>
                    {validationError ? (
                        <p className="max-w-44 text-right text-[11px] leading-4 text-rose-600">
                            {validationError}
                        </p>
                    ) : isDirty ? (
                        <p className="text-[11px] text-amber-600">Kaydedilmemiş değişiklik var.</p>
                    ) : (
                        <p className="text-[11px] text-neutral-400">Satır güncel.</p>
                    )}
                </div>
            </TableCell>
        </TableRow>
        <AnimatePresence initial={false}>
            {isExpanded ? (
                <TableRow>
                    <TableCell colSpan={6} className="border-t-0 bg-white px-5 pb-5 pt-0">
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <UserExpandedPanel user={user} draft={draft} />
                        </motion.div>
                    </TableCell>
                </TableRow>
            ) : null}
        </AnimatePresence>
        </>
    )
}

function UserMobileCard({
    user,
    draft,
    suppliers,
    customers,
    isOwnerViewer,
    isSaving,
    isLoadingSuppliers,
    isLoadingCustomers,
    isSelected,
    onToggleSelected,
    onDraftChange,
    onSave,
    onOpenEditor,
}: {
    user: AdminUser
    draft: UserDraft | undefined
    suppliers: Supplier[]
    customers: CustomerOption[]
    isOwnerViewer: boolean
    isSaving: boolean
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    isSelected: boolean
    onToggleSelected: () => void
    onDraftChange: (patch: UserDraft) => void
    onSave: () => void
    onOpenEditor: () => void
}) {
    const effective = getEffectiveDraft(user, draft)
    const isDirty = isUserDraftDirty(user, draft)
    const validationError = validateUserDraft(user, draft)
    const canSave = isDirty && !validationError
    const displayName = getUserDisplayName(user) || user.email

    return (
        <Collapsible className="rounded-[24px] border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 p-4">
                <Checkbox checked={isSelected} onCheckedChange={onToggleSelected} className="mt-0.5" />
                <CollapsibleTrigger asChild>
                    <button className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <Avatar size="lg" className="ring-1 ring-neutral-200">
                            <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} className="object-cover" />
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-neutral-950">{displayName}</div>
                            <div className="truncate text-xs text-neutral-500">{user.email}</div>
                            <div className="truncate text-xs text-neutral-500">@{user.identifier}</div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <UserAccessStatusBadge status={effective.accessStatus} />
                                <Badge variant="outline" className={USER_CELL_BADGE_CLASS}>{GROUP_LABELS[effective.group]}</Badge>
                            </div>
                            {user.customer ? (
                                <div className="mt-2 truncate text-[11px] text-neutral-500">
                                    {getCustomerContactMeta(user) || "Müşteri iletişim meta verisi eklenmedi"}
                                </div>
                            ) : null}
                        </div>
                        <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform data-[state=open]:rotate-180" />
                    </button>
                </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="border-t border-neutral-200 px-4 pb-4">
                <div className="space-y-4 pt-4">
                    <UserRoleCell
                        user={user}
                        group={effective.group}
                        isOwnerViewer={isOwnerViewer}
                        onGroupChange={(group) => onDraftChange({
                            group,
                            accessStatus: getDefaultAccessStatusForGroup(group),
                        })}
                    />
                    <UserAccessStatusCell
                        status={effective.accessStatus}
                        onStatusChange={(accessStatus) => onDraftChange({ accessStatus })}
                    />
                    <UserPortalLinksCell
                        group={effective.group}
                        supplierId={effective.supplierId}
                        customerId={effective.customerId}
                        suppliers={suppliers}
                        customers={customers}
                        isLoadingSuppliers={isLoadingSuppliers}
                        isLoadingCustomers={isLoadingCustomers}
                        onSupplierChange={(supplierId) => onDraftChange({ supplierId })}
                        onCustomerChange={(customerId) => onDraftChange({ customerId })}
                    />
                    <UserOperationalAssignmentsCell
                        group={effective.group}
                        assignedSupplierIds={effective.assignedSupplierIds}
                        assignedCustomerIds={effective.assignedCustomerIds}
                        suppliers={suppliers}
                        customers={customers}
                        isLoadingSuppliers={isLoadingSuppliers}
                        isLoadingCustomers={isLoadingCustomers}
                        onAssignedSupplierIdsChange={(assignedSupplierIds) => onDraftChange({ assignedSupplierIds })}
                        onAssignedCustomerIdsChange={(assignedCustomerIds) => onDraftChange({ assignedCustomerIds })}
                    />
                    <UserExpandedPanel user={user} draft={draft} />
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-[11px] leading-4">
                            {validationError ? (
                                <p className="text-rose-600">{validationError}</p>
                            ) : isDirty ? (
                                <p className="text-amber-600">Kaydedilmemiş değişiklik var.</p>
                            ) : (
                                <p className="text-neutral-400">Satır güncel.</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={onOpenEditor}>
                                Düzenle
                            </Button>
                            <UserSaveButton canSave={canSave} isSaving={isSaving} onSave={onSave} />
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

function QuickFilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                    : "border-neutral-200 bg-white/90 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
            )}
        >
            {children}
        </button>
    )
}

function UsersQuickControls({
    quickRole,
    quickLink,
    quickState,
    sortKey,
    sortDirection,
    onQuickRoleChange,
    onQuickLinkChange,
    onQuickStateChange,
    onSortKeyChange,
    onSortDirectionToggle,
    onReset,
}: {
    quickRole: QuickRoleFilter
    quickLink: QuickLinkFilter
    quickState: QuickStateFilter
    sortKey: SortKey
    sortDirection: SortDirection
    onQuickRoleChange: (value: QuickRoleFilter) => void
    onQuickLinkChange: (value: QuickLinkFilter) => void
    onQuickStateChange: (value: QuickStateFilter) => void
    onSortKeyChange: (value: SortKey) => void
    onSortDirectionToggle: () => void
    onReset: () => void
}) {
    return (
        <div className="space-y-4 border-b border-neutral-200 bg-white/80 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                    <Filter className="h-3.5 w-3.5" />
                    Hızlı filtreler
                </div>
                {QUICK_ROLE_CHIPS.map((chip) => (
                    <QuickFilterButton
                        key={chip.value}
                        active={quickRole === chip.value}
                        onClick={() => onQuickRoleChange(chip.value)}
                    >
                        {chip.label}
                    </QuickFilterButton>
                ))}
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                    {QUICK_LINK_CHIPS.map((chip) => {
                        const Icon = chip.icon
                        return (
                            <QuickFilterButton
                                key={chip.value}
                                active={quickLink === chip.value}
                                onClick={() => onQuickLinkChange(chip.value)}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon className="h-3.5 w-3.5" />
                                    {chip.label}
                                </span>
                            </QuickFilterButton>
                        )
                    })}
                    {QUICK_STATE_CHIPS.map((chip) => (
                        <QuickFilterButton
                            key={chip.value}
                            active={quickState === chip.value}
                            onClick={() => onQuickStateChange(chip.value)}
                        >
                            {chip.label}
                        </QuickFilterButton>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        Sıralama
                    </div>
                    <Select value={sortKey} onValueChange={(value) => onSortKeyChange(value as SortKey)}>
                        <SelectTrigger className="h-10 min-w-44 rounded-xl bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <QuickFilterButton active={false} onClick={onSortDirectionToggle}>
                        {sortDirection === "asc" ? "Artan" : "Azalan"}
                    </QuickFilterButton>
                    <Button type="button" variant="ghost" className="rounded-xl" onClick={onReset}>
                        Sıfırla
                    </Button>
                </div>
            </div>
        </div>
    )
}

function UsersTable({
    users,
    dirtyCount,
    draftsByUserId,
    suppliers,
    customers,
    isOwnerViewer,
    isLoading,
    isLoadingSuppliers,
    isLoadingCustomers,
    savingUserId,
    expandedUserIds,
    selectedUserIds,
    quickRole,
    quickLink,
    quickState,
    sortKey,
    sortDirection,
    onToggleExpand,
    onQuickRoleChange,
    onQuickLinkChange,
    onQuickStateChange,
    onSortKeyChange,
    onSortDirectionToggle,
    onToggleSelected,
    onResetQuickControls,
    onDraftChange,
    onSave,
    onOpenEditor,
}: {
    users: AdminUser[]
    dirtyCount: number
    draftsByUserId: Record<string, UserDraft>
    suppliers: Supplier[]
    customers: CustomerOption[]
    isOwnerViewer: boolean
    isLoading: boolean
    isLoadingSuppliers: boolean
    isLoadingCustomers: boolean
    savingUserId: string | null
    expandedUserIds: string[]
    selectedUserIds: string[]
    quickRole: QuickRoleFilter
    quickLink: QuickLinkFilter
    quickState: QuickStateFilter
    sortKey: SortKey
    sortDirection: SortDirection
    onToggleExpand: (userId: string) => void
    onQuickRoleChange: (value: QuickRoleFilter) => void
    onQuickLinkChange: (value: QuickLinkFilter) => void
    onQuickStateChange: (value: QuickStateFilter) => void
    onSortKeyChange: (value: SortKey) => void
    onSortDirectionToggle: () => void
    onToggleSelected: (userId: string) => void
    onResetQuickControls: () => void
    onDraftChange: (userId: string, patch: UserDraft) => void
    onSave: (userId: string) => void
    onOpenEditor: (user: AdminUser) => void
}) {
    return (
        <div className="overflow-hidden rounded-[28px]">
            <div className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_transparent_36%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-neutral-900">Kullanıcı Yetki Masası</h2>
                        <p className="text-xs text-neutral-500">
                            Rol, erişim, portal bağları ve operasyon atamaları aynı satırdan yönetilir.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-neutral-600 shadow-sm">
                            <span className="font-semibold text-neutral-900">{users.length}</span> kullanıcı listeleniyor
                        </div>
                        <div className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-neutral-600 shadow-sm">
                            <span className={cn("font-semibold", dirtyCount > 0 ? "text-amber-700" : "text-emerald-700")}>{dirtyCount}</span> satır beklemede
                        </div>
                        <div className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-neutral-600 shadow-sm">
                            Satır bazlı kayıt aktif
                        </div>
                    </div>
                </div>
            </div>

            <UsersQuickControls
                quickRole={quickRole}
                quickLink={quickLink}
                quickState={quickState}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onQuickRoleChange={onQuickRoleChange}
                onQuickLinkChange={onQuickLinkChange}
                onQuickStateChange={onQuickStateChange}
                onSortKeyChange={onSortKeyChange}
                onSortDirectionToggle={onSortDirectionToggle}
                onReset={onResetQuickControls}
            />

            <div className="space-y-3 bg-[linear-gradient(180deg,rgba(250,250,250,0.7),rgba(255,255,255,1))] p-3 lg:hidden">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-28 animate-pulse rounded-[24px] border border-neutral-200 bg-neutral-100" />
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                        Filtrelere uygun kullanıcı bulunamadı.
                    </div>
                ) : (
                    users.map((user) => (
                        <UserMobileCard
                            key={user.id}
                            user={user}
                            draft={draftsByUserId[user.id]}
                            suppliers={suppliers}
                            customers={customers}
                            isOwnerViewer={isOwnerViewer}
                            isSaving={savingUserId === user.id}
                            isLoadingSuppliers={isLoadingSuppliers}
                            isLoadingCustomers={isLoadingCustomers}
                            isSelected={selectedUserIds.includes(user.id)}
                            onToggleSelected={() => onToggleSelected(user.id)}
                            onDraftChange={(patch) => onDraftChange(user.id, patch)}
                            onSave={() => onSave(user.id)}
                            onOpenEditor={() => onOpenEditor(user)}
                        />
                    ))
                )}
            </div>

            <div className="hidden overflow-x-auto bg-[linear-gradient(180deg,rgba(250,250,250,0.7),rgba(255,255,255,1))] lg:block">
                <Table className="min-w-[1280px]">
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                    <TableRow>
                        <TableHead className="sticky left-0 z-20 w-[260px] bg-white/95 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Kullanıcı</TableHead>
                        <TableHead className="w-[240px] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Rol</TableHead>
                        <TableHead className="w-[200px] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Erişim</TableHead>
                        <TableHead className="w-[320px] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Portal Bağları</TableHead>
                        <TableHead className="w-[360px] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Operasyon Atamaları</TableHead>
                        <TableHead className="w-[160px] py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">İşlem</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isLoading ? <UsersTableLoadingRow /> : null}

                    {!isLoading && users.map((user) => (
                        <UserTableRow
                            key={user.id}
                            user={user}
                            draft={draftsByUserId[user.id]}
                            suppliers={suppliers}
                            customers={customers}
                            isOwnerViewer={isOwnerViewer}
                            isSaving={savingUserId === user.id}
                            isLoadingSuppliers={isLoadingSuppliers}
                            isLoadingCustomers={isLoadingCustomers}
                            isSelected={selectedUserIds.includes(user.id)}
                            onToggleSelected={() => onToggleSelected(user.id)}
                            isExpanded={expandedUserIds.includes(user.id)}
                            onToggleExpand={() => onToggleExpand(user.id)}
                            onDraftChange={(patch) => onDraftChange(user.id, patch)}
                            onSave={() => onSave(user.id)}
                            onOpenEditor={() => onOpenEditor(user)}
                        />
                    ))}

                    {!isLoading && users.length === 0 ? <UsersTableEmptyRow /> : null}
                </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function UsersPageClient() {
    const { data: session } = useSession()
    const initialQuickFilters = readPersistedQuickFilters()
    const [draftsByUserId, setDraftsByUserId] = useState<Record<string, UserDraft>>({})
    const [savingUserId, setSavingUserId] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [expandedUserIds, setExpandedUserIds] = useState<string[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [quickRole, setQuickRole] = useState<QuickRoleFilter>(initialQuickFilters.quickRole)
    const [quickLink, setQuickLink] = useState<QuickLinkFilter>(initialQuickFilters.quickLink)
    const [quickState, setQuickState] = useState<QuickStateFilter>(initialQuickFilters.quickState)
    const [sortKey, setSortKey] = useState<SortKey>(initialQuickFilters.sortKey)
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialQuickFilters.sortDirection)
    const [comparisonOpen, setComparisonOpen] = useState(false)
    const updateAccess = useUserAccessUpdate()

    const {
        filters,
        params,
        setSearch,
        setAccessStatus,
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
    const customerQuery = useCustomers({ params: { page: 1, limit: 500 } })

    const users = userQuery.data?.data ?? EMPTY_USERS
    const meta = userQuery.data?.meta
    const suppliers = supplierQuery.data?.data ?? EMPTY_SUPPLIERS
    const customers = customerQuery.data?.data ?? EMPTY_CUSTOMERS
    const viewerGroups = session?.user?.groups ?? []
    const isOwnerViewer = viewerGroups.includes("owner")

    const dirtyCount = useMemo(
        () => users.filter((user) => isUserDraftDirty(user, draftsByUserId[user.id])).length,
        [draftsByUserId, users],
    )

    const filteredUsers = useMemo(
        () => users.filter((user) => matchesQuickFilters(user, draftsByUserId[user.id], quickRole, quickLink, quickState)),
        [draftsByUserId, quickLink, quickRole, quickState, users],
    )

    const visibleUsers = useMemo(
        () => sortUsers(filteredUsers, draftsByUserId, sortKey, sortDirection),
        [draftsByUserId, filteredUsers, sortDirection, sortKey],
    )

    const visibleUserIds = useMemo(
        () => visibleUsers.map((user) => user.id),
        [visibleUsers],
    )

    const activeSelectedUserIds = useMemo(
        () => selectedUserIds.filter((id) => visibleUserIds.includes(id)),
        [selectedUserIds, visibleUserIds],
    )

    const activeExpandedUserIds = useMemo(
        () => expandedUserIds.filter((id) => visibleUserIds.includes(id)),
        [expandedUserIds, visibleUserIds],
    )

    const comparisonUsers = useMemo(
        () => visibleUsers.filter((user) => activeSelectedUserIds.includes(user.id)).slice(0, 2),
        [activeSelectedUserIds, visibleUsers],
    )

    useEffect(() => {
        const payload: UsersQuickFiltersPersisted = {
            quickRole,
            quickLink,
            quickState,
            sortKey,
            sortDirection,
        }
        window.localStorage.setItem(USERS_QUICK_FILTERS_STORAGE_KEY, JSON.stringify(payload))
    }, [quickLink, quickRole, quickState, sortDirection, sortKey])

    function patchDraft(userId: string, patch: UserDraft) {
        setDraftsByUserId((prev) => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                ...patch,
            },
        }))
    }

    function toggleExpanded(userId: string) {
        setExpandedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        )
    }

    function toggleSelected(userId: string) {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        )
    }

    function resetQuickControls() {
        setQuickRole("all")
        setQuickLink("all")
        setQuickState("all")
        setSortKey("createdAt")
        setSortDirection("desc")
    }

    async function handleSave(userId: string) {
        const user = users.find((item) => item.id === userId)
        if (!user) return

        const validationError = validateUserDraft(user, draftsByUserId[userId])
        if (validationError) {
            toast.error(validationError)
            return
        }

        try {
            setSavingUserId(userId)
            const payload = await updateAccess.saveDraft(user, draftsByUserId[userId])
            setDraftsByUserId((prev) => {
                const next = { ...prev }
                delete next[userId]
                return next
            })
            toast.success(payload.roleChanged ? "Rol ve erişim güncellendi." : "Kullanıcı atamaları güncellendi.")
        } catch {
            toast.error("Kullanıcı güncellenemedi.")
        } finally {
            setSavingUserId(null)
        }
    }

    async function handleDialogSave(user: AdminUser, values: UserEditorFormValues) {
        const payload = buildUserEditorSubmission(user, values)
        if (!payload.profileChanged && !payload.roleChanged && !payload.assignmentsChanged) {
            toast.message("Güncellenecek bir alan bulunmuyor.")
            setEditingUser(null)
            return
        }

        try {
            setSavingUserId(user.id)
            const result = await updateAccess.saveEditor(user, values)
            setDraftsByUserId((prev) => {
                const next = { ...prev }
                delete next[user.id]
                return next
            })
            setEditingUser(null)

            if (result.profileChanged && (result.roleChanged || result.assignmentsChanged)) {
                toast.success("Kullanıcı profili, rolü ve atamaları güncellendi.")
            } else if (result.profileChanged) {
                toast.success("Kullanıcı profili güncellendi.")
            } else if (result.roleChanged) {
                toast.success("Rol ve erişim güncellendi.")
            } else {
                toast.success("Kullanıcı atamaları güncellendi.")
            }
        } catch {
            toast.error("Kullanıcı bilgileri güncellenemedi.")
        } finally {
            setSavingUserId(null)
        }
    }

    async function handleSaveSelected() {
        for (const userId of activeSelectedUserIds) {
            const user = visibleUsers.find((item) => item.id === userId)
            if (!user || !isUserDraftDirty(user, draftsByUserId[userId])) continue
            const validationError = validateUserDraft(user, draftsByUserId[userId])
            if (validationError) {
                toast.error(`${user.email}: ${validationError}`)
                continue
            }
            await handleSave(userId)
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="rounded-[28px] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.92))] p-6 shadow-sm"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
                            <Users className="h-3.5 w-3.5" />
                            Kimlik ve Yetki Yönetimi
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Kullanıcılar</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                                Portal bağlarını, erişim durumlarını ve operasyon atamalarını aynı tablo üzerinden yönetin.
                                Satın alma kullanıcılarına tedarikçi, satış kullanıcılarına müşteri atayın.
                            </p>
                        </div>
                    </div>

                    <motion.div
                        animate={dirtyCount > 0 ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 text-sm text-neutral-600 shadow-sm"
                    >
                        <span className={cn("font-semibold", dirtyCount > 0 ? "text-amber-700" : "text-emerald-700")}>
                            {dirtyCount}
                        </span>{" "}
                        satırda bekleyen değişiklik var.
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.4, ease: "easeOut" }}
            >
                <UserListFilters
                    search={filters.search}
                    accessStatus={filters.accessStatus}
                    onSearchChange={setSearch}
                    onAccessStatusChange={setAccessStatus}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            >
                <AdminListRefreshBar
                    dataUpdatedAt={userQuery.dataUpdatedAt}
                    isFetching={userQuery.isFetching}
                    onRefresh={() => void userQuery.refetch()}
                    refreshIntervalSeconds={filters.refreshIntervalSeconds}
                    onRefreshIntervalChange={setRefreshIntervalSeconds}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
            >
                <UsersStatsStrip users={visibleUsers} draftsByUserId={draftsByUserId} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13, duration: 0.4, ease: "easeOut" }}
            >
                <UsersBulkActions
                    selectedCount={activeSelectedUserIds.length}
                    compareDisabled={activeSelectedUserIds.length !== 2}
                    onClearSelection={() => setSelectedUserIds([])}
                    onExpandSelection={() => setExpandedUserIds(Array.from(new Set([...expandedUserIds, ...activeSelectedUserIds])))}
                    onCompare={() => setComparisonOpen(true)}
                    onSaveSelection={() => void handleSaveSelected()}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.45, ease: "easeOut" }}
                className="rounded-[28px] border border-neutral-200 bg-white shadow-sm"
            >
                <UsersTable
                    users={visibleUsers}
                    dirtyCount={dirtyCount}
                    draftsByUserId={draftsByUserId}
                    suppliers={suppliers}
                    customers={customers}
                    isOwnerViewer={isOwnerViewer}
                    isLoading={userQuery.isLoading}
                    isLoadingSuppliers={supplierQuery.isLoading}
                    isLoadingCustomers={customerQuery.isLoading}
                    savingUserId={savingUserId}
                    expandedUserIds={activeExpandedUserIds}
                    selectedUserIds={activeSelectedUserIds}
                    quickRole={quickRole}
                    quickLink={quickLink}
                    quickState={quickState}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onToggleExpand={toggleExpanded}
                    onQuickRoleChange={setQuickRole}
                    onQuickLinkChange={setQuickLink}
                    onQuickStateChange={setQuickState}
                    onSortKeyChange={setSortKey}
                    onSortDirectionToggle={() => setSortDirection((prev) => prev === "asc" ? "desc" : "asc")}
                    onToggleSelected={toggleSelected}
                    onResetQuickControls={resetQuickControls}
                    onDraftChange={patchDraft}
                    onSave={handleSave}
                    onOpenEditor={setEditingUser}
                />
            </motion.div>

            <UserEditDialog
                open={Boolean(editingUser)}
                user={editingUser}
                suppliers={suppliers}
                customers={customers}
                isOwnerViewer={isOwnerViewer}
                isSaving={savingUserId === editingUser?.id}
                isLoadingSuppliers={supplierQuery.isLoading}
                isLoadingCustomers={customerQuery.isLoading}
                onOpenChange={(open) => {
                    if (!open) setEditingUser(null)
                }}
                onSubmit={handleDialogSave}
            />

            <UserComparisonDialog
                open={comparisonOpen}
                onOpenChange={setComparisonOpen}
                users={comparisonUsers}
                draftsByUserId={draftsByUserId}
            />

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
