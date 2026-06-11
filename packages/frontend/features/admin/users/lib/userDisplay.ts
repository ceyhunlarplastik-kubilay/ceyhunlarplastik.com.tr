import type { Supplier } from "@/features/admin/suppliers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { getEffectiveDraft, type UserAccessDraft } from "@/features/admin/users/lib/userDrafts"
import type { CustomerOption } from "@/features/admin/users/schema/userEditor"
import { getUserDisplayName } from "@/lib/users/displayName"

export function getInitials(user: Pick<AdminUser, "identifier" | "email">) {
    const source = getUserDisplayName(user) || user.email || "??"
    return source.slice(0, 2).toUpperCase()
}

export function formatUserDateTime(value?: string | null) {
    if (!value) return "Bilgi yok"

    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value))
}

export function formatUserDateShort(value?: string | null) {
    if (!value) return "-"

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))
}

export function getCustomerContactMeta(user: AdminUser) {
    const parts = [user.customerContactTitle, user.customerContactDepartment]
        .map((value) => value?.trim())
        .filter(Boolean)

    if (parts.length === 0) {
        return user.isPrimaryCustomerContact ? "Ana yetkili" : ""
    }

    const meta = parts.join(" / ")
    return user.isPrimaryCustomerContact ? `${meta} / Ana yetkili` : meta
}

export function resolveSupplierName(
    user: AdminUser,
    suppliers: Supplier[],
    supplierId?: string | null,
) {
    if (!supplierId) return null
    if (user.supplierId === supplierId && user.supplier?.name) return user.supplier.name
    return suppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Tedarikçi seçildi"
}

export function resolveCustomerName(
    user: AdminUser,
    customers: CustomerOption[],
    customerId?: string | null,
) {
    if (!customerId) return null
    if (user.customerId === customerId && user.customer) {
        return user.customer.companyName || user.customer.fullName
    }

    const customer = customers.find((item) => item.id === customerId)
    return customer ? (customer.companyName || customer.fullName) : "Müşteri seçildi"
}

export function getPortalLinkSummary(
    user: AdminUser,
    draft: UserAccessDraft | undefined,
    suppliers: Supplier[],
    customers: CustomerOption[],
) {
    const effective = getEffectiveDraft(user, draft)

    return {
        supplierName: resolveSupplierName(user, suppliers, effective.supplierId),
        customerName: resolveCustomerName(user, customers, effective.customerId),
    }
}

export function getUserAssignmentSummary(user: AdminUser, draft: UserAccessDraft | undefined) {
    const effective = getEffectiveDraft(user, draft)

    return {
        purchasingCount: effective.assignedSupplierIds.length,
        salesCount: effective.assignedCustomerIds.length,
    }
}
