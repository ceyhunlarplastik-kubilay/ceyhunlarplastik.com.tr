import { z } from "zod"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import type { AdminUser } from "@/features/admin/users/api/types"
import { normalizeUserPhoneInput, USER_PHONE_INPUT_REGEX } from "@/features/admin/users/schema/phone"

export const USER_GROUP_VALUES = [
    "user",
    "supplier",
    "purchasing",
    "sales",
    "sales_director",
    "customer",
    "admin",
    "owner",
] as const

export const ACCESS_STATUS_VALUES = [
    "PENDING_REVIEW",
    "ACTIVE",
    "SUSPENDED",
    "REJECTED",
] as const

export type UserGroup = typeof USER_GROUP_VALUES[number]
export type AccessStatus = typeof ACCESS_STATUS_VALUES[number]

export type RoleOption = {
    value: UserGroup
    label: string
}

type RoleAssignmentConfig = {
    requiresPortalSupplier?: boolean
    requiresPortalCustomer?: boolean
    canAssignSuppliers?: boolean
    canAssignCustomers?: boolean
}

const BUSINESS_GROUP_OPTIONS: RoleOption[] = [
    { value: "user", label: "İnceleme bekleyen kullanıcı" },
    { value: "supplier", label: "Tedarikçi" },
    { value: "purchasing", label: "Satın alma" },
    { value: "sales", label: "Satış" },
    { value: "sales_director", label: "Satış direktörü" },
    { value: "customer", label: "Müşteri portalı" },
]

const PRIVILEGED_GROUP_OPTIONS: RoleOption[] = [
    { value: "admin", label: "Admin" },
    { value: "owner", label: "Owner" },
]

export const ACCESS_STATUS_OPTIONS: Array<{ value: AccessStatus; label: string }> = [
    { value: "PENDING_REVIEW", label: "İnceleniyor" },
    { value: "ACTIVE", label: "Aktif" },
    { value: "SUSPENDED", label: "Askıya alındı" },
    { value: "REJECTED", label: "Reddedildi" },
]

export const GROUP_LABELS: Record<UserGroup, string> = {
    user: "İnceleme bekleyen kullanıcı",
    supplier: "Tedarikçi",
    purchasing: "Satın alma",
    sales: "Satış",
    sales_director: "Satış direktörü",
    customer: "Müşteri portalı",
    admin: "Admin",
    owner: "Owner",
}

export const ROLE_ASSIGNMENT_CONFIG: Record<UserGroup, RoleAssignmentConfig> = {
    user: {},
    supplier: { requiresPortalSupplier: true },
    purchasing: { canAssignSuppliers: true },
    sales: { canAssignCustomers: true },
    sales_director: {},
    customer: { requiresPortalCustomer: true },
    admin: {},
    owner: {},
}

export const userEditorSchema = z.object({
    firstName: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(120),
    lastName: z.string().trim().min(2, "Soyad en az 2 karakter olmalı.").max(120),
    identifier: z.string().trim().min(2, "Görünen isim en az 2 karakter olmalı.").max(120),
    email: z.email("Geçerli bir e-posta girin.").trim(),
    phone: z.union([z.string().trim(), z.null()])
        .superRefine((value, ctx) => {
            if (value === null || value.length === 0) return

            if (!USER_PHONE_INPUT_REGEX.test(value)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Telefon numarasi yalnizca rakam, bosluk, parantez, tire ve + karakteri icerebilir.",
                })
                return
            }

            if (!normalizeUserPhoneInput(value)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Telefon numarasini +90 555 123 45 67 biciminde girin.",
                })
            }
        })
        .transform((value) => {
            if (value === null || value.length === 0) return null
            return normalizeUserPhoneInput(value)
        }),
    group: z.enum(USER_GROUP_VALUES),
    accessStatus: z.enum(ACCESS_STATUS_VALUES),
    supplierId: z.string().uuid().nullable(),
    customerId: z.string().uuid().nullable(),
    customerContactTitle: z.union([z.string().trim().max(120), z.null()])
        .transform((value) => value && value.length > 0 ? value : null),
    customerContactDepartment: z.union([z.string().trim().max(120), z.null()])
        .transform((value) => value && value.length > 0 ? value : null),
    isPrimaryCustomerContact: z.boolean(),
    assignedSupplierIds: z.array(z.string().uuid()).max(500),
    assignedCustomerIds: z.array(z.string().uuid()).max(500),
}).superRefine((value, ctx) => {
    const config = ROLE_ASSIGNMENT_CONFIG[value.group]

    if (config.requiresPortalSupplier && !value.supplierId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["supplierId"],
            message: "Tedarikçi rolü için bir portal tedarikçi seçmelisiniz.",
        })
    }

    if (config.requiresPortalCustomer && !value.customerId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customerId"],
            message: "Müşteri portalı rolü için bir portal müşteri seçmelisiniz.",
        })
    }

    if (value.isPrimaryCustomerContact && !value.customerId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customerId"],
            message: "Ana yetkili belirlemek için önce portal müşteri bağlantısı seçilmelidir.",
        })
    }
})

export type UserEditorFormValues = z.infer<typeof userEditorSchema>
export type CustomerOption = Pick<AdminCustomer, "id" | "fullName" | "companyName" | "status">

function uniqueSorted(values: string[]) {
    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "tr"))
}

function areEqual(left: string[], right: string[]) {
    const normalizedLeft = uniqueSorted(left)
    const normalizedRight = uniqueSorted(right)

    if (normalizedLeft.length !== normalizedRight.length) return false
    return normalizedLeft.every((value, index) => value === normalizedRight[index])
}

export function getUserDisplayGroup(user: AdminUser) {
    return (user.groups[0] ?? "user") as UserGroup
}

export function getDefaultAccessStatusForGroup(group: UserGroup): AccessStatus {
    return group === "user" ? "PENDING_REVIEW" : "ACTIVE"
}

export function getRoleOptions(user: AdminUser, isOwnerViewer: boolean): RoleOption[] {
    if (isOwnerViewer) {
        return [...BUSINESS_GROUP_OPTIONS, ...PRIVILEGED_GROUP_OPTIONS]
    }

    const currentGroup = getUserDisplayGroup(user)
    if (currentGroup === "admin" || currentGroup === "owner") {
        return [...BUSINESS_GROUP_OPTIONS, { value: currentGroup, label: GROUP_LABELS[currentGroup] }]
    }

    return BUSINESS_GROUP_OPTIONS
}

export function toUserEditorFormValues(user: AdminUser): UserEditorFormValues {
    return {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        identifier: user.identifier ?? "",
        email: user.email ?? "",
        phone: user.phone ?? null,
        group: getUserDisplayGroup(user),
        accessStatus: user.accessStatus as AccessStatus,
        supplierId: user.supplierId ?? null,
        customerId: user.customerId ?? null,
        customerContactTitle: user.customerContactTitle ?? null,
        customerContactDepartment: user.customerContactDepartment ?? null,
        isPrimaryCustomerContact: user.isPrimaryCustomerContact ?? false,
        assignedSupplierIds: (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id),
        assignedCustomerIds: (user.assignedSalesCustomers ?? []).map((customer) => customer.id),
    }
}

export function buildUserEditorSubmission(user: AdminUser, values: UserEditorFormValues) {
    const config = ROLE_ASSIGNMENT_CONFIG[values.group]
    const normalizedSupplierId = config.requiresPortalSupplier ? (values.supplierId ?? null) : null
    const normalizedCustomerId = config.requiresPortalCustomer ? (values.customerId ?? null) : null
    const normalizedCustomerContactTitle = normalizedCustomerId ? values.customerContactTitle : null
    const normalizedCustomerContactDepartment = normalizedCustomerId ? values.customerContactDepartment : null
    const normalizedIsPrimaryCustomerContact = normalizedCustomerId ? values.isPrimaryCustomerContact : false
    const normalizedAssignedSupplierIds = config.canAssignSuppliers ? uniqueSorted(values.assignedSupplierIds) : []
    const normalizedAssignedCustomerIds = config.canAssignCustomers ? uniqueSorted(values.assignedCustomerIds) : []
    const currentGroup = getUserDisplayGroup(user)
    const currentAssignedSupplierIds = (user.assignedPurchasingSuppliers ?? []).map((supplier) => supplier.id)
    const currentAssignedCustomerIds = (user.assignedSalesCustomers ?? []).map((customer) => customer.id)
    const currentPhone = user.phone ?? null

    return {
        profileChanged:
            values.firstName !== (user.firstName ?? "")
            || values.lastName !== (user.lastName ?? "")
            || values.identifier !== user.identifier
            || values.email !== user.email
            || values.phone !== currentPhone
            || normalizedCustomerContactTitle !== (user.customerContactTitle ?? null)
            || normalizedCustomerContactDepartment !== (user.customerContactDepartment ?? null)
            || normalizedIsPrimaryCustomerContact !== (user.isPrimaryCustomerContact ?? false),
        roleChanged:
            values.group !== currentGroup
            || values.accessStatus !== user.accessStatus
            || normalizedSupplierId !== (user.supplierId ?? null)
            || normalizedCustomerId !== (user.customerId ?? null),
        assignmentsChanged:
            normalizedSupplierId !== (user.supplierId ?? null)
            || normalizedCustomerId !== (user.customerId ?? null)
            || !areEqual(normalizedAssignedSupplierIds, currentAssignedSupplierIds)
            || !areEqual(normalizedAssignedCustomerIds, currentAssignedCustomerIds),
        profilePayload: {
            id: user.id,
            firstName: values.firstName,
            lastName: values.lastName,
            identifier: values.identifier,
            email: values.email,
            phone: values.phone,
            customerContactTitle: normalizedCustomerContactTitle,
            customerContactDepartment: normalizedCustomerContactDepartment,
            isPrimaryCustomerContact: normalizedIsPrimaryCustomerContact,
        },
        rolePayload: {
            id: user.id,
            group: values.group,
            accessStatus: values.accessStatus,
            supplierId: normalizedSupplierId,
            customerId: normalizedCustomerId,
            reason: null,
        },
        assignmentPayload: {
            id: user.id,
            supplierId: normalizedSupplierId,
            customerId: normalizedCustomerId,
            assignedSupplierIds: normalizedAssignedSupplierIds,
            assignedCustomerIds: normalizedAssignedCustomerIds,
        },
    }
}
