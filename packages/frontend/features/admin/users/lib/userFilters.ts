import type { AdminUser } from "@/features/admin/users/api/types"
import { GROUP_LABELS } from "@/features/admin/users/schema/userEditor"
import { getEffectiveDraft, isUserDraftDirty, type UserAccessDraft } from "@/features/admin/users/lib/userDrafts"

export const USERS_QUICK_FILTERS_STORAGE_KEY = "admin-users-quick-filters-v1"

export type QuickRoleFilter = "all" | "purchasing" | "sales" | "supplier" | "customer"
export type QuickLinkFilter = "all" | "portal_supplier" | "portal_customer" | "unlinked"
export type QuickStateFilter = "all" | "dirty" | "inactive"
export type SortKey = "createdAt" | "email" | "role" | "status"
export type SortDirection = "asc" | "desc"

export type UsersQuickFiltersPersisted = {
    quickRole: QuickRoleFilter
    quickLink: QuickLinkFilter
    quickState: QuickStateFilter
    sortKey: SortKey
    sortDirection: SortDirection
}

export const DEFAULT_USERS_QUICK_FILTERS: UsersQuickFiltersPersisted = {
    quickRole: "all",
    quickLink: "all",
    quickState: "all",
    sortKey: "createdAt",
    sortDirection: "desc",
}

export const QUICK_ROLE_OPTIONS: Array<{ value: QuickRoleFilter; label: string }> = [
    { value: "all", label: "Tüm Roller" },
    { value: "purchasing", label: "Satın Alma" },
    { value: "sales", label: "Satış" },
    { value: "supplier", label: "Tedarikçi" },
    { value: "customer", label: "Müşteri Portalı" },
]

export const QUICK_LINK_OPTIONS: Array<{ value: QuickLinkFilter; label: string }> = [
    { value: "all", label: "Tüm Bağlar" },
    { value: "portal_supplier", label: "Portal Tedarikçi" },
    { value: "portal_customer", label: "Portal Müşteri" },
    { value: "unlinked", label: "Bağsız Kullanıcı" },
]

export const QUICK_STATE_OPTIONS: Array<{ value: QuickStateFilter; label: string }> = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "dirty", label: "Taslak Var" },
    { value: "inactive", label: "Pasif" },
]

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: "createdAt", label: "Kayıt Tarihi" },
    { value: "email", label: "E-posta" },
    { value: "role", label: "Rol" },
    { value: "status", label: "Erişim Durumu" },
]

export function readPersistedQuickFilters(): UsersQuickFiltersPersisted {
    if (typeof window === "undefined") {
        return DEFAULT_USERS_QUICK_FILTERS
    }

    try {
        const raw = window.localStorage.getItem(USERS_QUICK_FILTERS_STORAGE_KEY)
        if (!raw) {
            return DEFAULT_USERS_QUICK_FILTERS
        }

        const parsed = JSON.parse(raw) as Partial<UsersQuickFiltersPersisted>

        return {
            quickRole: parsed.quickRole ?? DEFAULT_USERS_QUICK_FILTERS.quickRole,
            quickLink: parsed.quickLink ?? DEFAULT_USERS_QUICK_FILTERS.quickLink,
            quickState: parsed.quickState ?? DEFAULT_USERS_QUICK_FILTERS.quickState,
            sortKey: parsed.sortKey ?? DEFAULT_USERS_QUICK_FILTERS.sortKey,
            sortDirection: parsed.sortDirection ?? DEFAULT_USERS_QUICK_FILTERS.sortDirection,
        }
    } catch {
        return DEFAULT_USERS_QUICK_FILTERS
    }
}

export function persistQuickFilters(payload: UsersQuickFiltersPersisted) {
    if (typeof window === "undefined") return
    window.localStorage.setItem(USERS_QUICK_FILTERS_STORAGE_KEY, JSON.stringify(payload))
}

export function matchesQuickFilters(
    user: AdminUser,
    draft: UserAccessDraft | undefined,
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

export function sortUsers(
    users: AdminUser[],
    draftsByUserId: Record<string, UserAccessDraft>,
    sortKey: SortKey,
    sortDirection: SortDirection,
) {
    const direction = sortDirection === "asc" ? 1 : -1

    return [...users].sort((left, right) => {
        const leftEffective = getEffectiveDraft(left, draftsByUserId[left.id])
        const rightEffective = getEffectiveDraft(right, draftsByUserId[right.id])

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

export function getUsersStats(users: AdminUser[], draftsByUserId: Record<string, UserAccessDraft>) {
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
