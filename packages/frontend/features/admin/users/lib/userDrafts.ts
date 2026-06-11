import type { AdminUser } from "@/features/admin/users/api/types"
import {
    ROLE_ASSIGNMENT_CONFIG,
    getUserDisplayGroup,
    type AccessStatus,
    type UserGroup,
} from "@/features/admin/users/schema/userEditor"

export type UserAccessDraft = {
    group?: UserGroup
    accessStatus?: AccessStatus
    supplierId?: string | null
    customerId?: string | null
    assignedSupplierIds?: string[]
    assignedCustomerIds?: string[]
}

function uniqueSorted(values: string[]) {
    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "tr"))
}

export function areStringArraysEqual(left: string[], right: string[]) {
    const leftSorted = uniqueSorted(left)
    const rightSorted = uniqueSorted(right)

    if (leftSorted.length !== rightSorted.length) return false
    return leftSorted.every((value, index) => value === rightSorted[index])
}

export function getEffectiveDraft(user: AdminUser, draft: UserAccessDraft | undefined) {
    const group = draft?.group ?? getUserDisplayGroup(user)
    const accessStatus = draft?.accessStatus ?? user.accessStatus
    const supplierId = draft?.supplierId !== undefined ? draft.supplierId : (user.supplierId ?? null)
    const customerId = draft?.customerId !== undefined ? draft.customerId : (user.customerId ?? null)
    const assignedSupplierIds =
        draft?.assignedSupplierIds
        ?? (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id)
    const assignedCustomerIds =
        draft?.assignedCustomerIds
        ?? (user.assignedSalesCustomers ?? []).map((customer) => customer.id)

    return {
        group,
        accessStatus,
        supplierId,
        customerId,
        assignedSupplierIds,
        assignedCustomerIds,
    }
}

export function isUserDraftDirty(user: AdminUser, draft: UserAccessDraft | undefined) {
    if (!draft) return false

    const effective = getEffectiveDraft(user, draft)

    return (
        effective.group !== getUserDisplayGroup(user)
        || effective.accessStatus !== user.accessStatus
        || effective.supplierId !== (user.supplierId ?? null)
        || effective.customerId !== (user.customerId ?? null)
        || !areStringArraysEqual(
            effective.assignedSupplierIds,
            (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id),
        )
        || !areStringArraysEqual(
            effective.assignedCustomerIds,
            (user.assignedSalesCustomers ?? []).map((customer) => customer.id),
        )
    )
}

export function buildUserUpdatePayload(user: AdminUser, draft: UserAccessDraft | undefined) {
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
            || !areStringArraysEqual(
                normalizedAssignedSupplierIds,
                (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id),
            )
            || !areStringArraysEqual(
                normalizedAssignedCustomerIds,
                (user.assignedSalesCustomers ?? []).map((customer) => customer.id),
            ),
    }
}

export function validateUserDraft(user: AdminUser, draft: UserAccessDraft | undefined) {
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
