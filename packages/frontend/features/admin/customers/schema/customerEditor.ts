import { z } from "zod"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import type { UpdateCustomerInput } from "@/features/admin/customers/api/updateCustomer"

function optionalText(max: number) {
    return z.string().trim().max(max).optional().transform((value) => value || "")
}

function optionalNullableNumber(
    constraints: {
        min?: number
        max?: number
        integer?: boolean
        message: string
    },
) {
    return z.preprocess((value) => {
        if (value === "" || value === null || value === undefined) return null
        if (typeof value === "number") return value
        if (typeof value === "string") return Number(value.replace(",", "."))
        return value
    }, z.number()
        .refine((value) => Number.isFinite(value), constraints.message)
        .refine((value) => constraints.min === undefined || value >= constraints.min, constraints.message)
        .refine((value) => constraints.max === undefined || value <= constraints.max, constraints.message)
        .refine((value) => !constraints.integer || Number.isInteger(value), constraints.message)
        .nullable())
}

export const customerEditorSchema = z.object({
    companyName: optionalText(255),
    fullName: z.string().trim().min(2, "Yetkili adı en az 2 karakter olmalıdır").max(255, "Yetkili adı çok uzun"),
    phone: z.string().trim().min(5, "Telefon çok kısa").max(50, "Telefon çok uzun"),
    email: z.email("Geçerli bir e-posta adresi girin"),
    note: optionalText(5000),
    status: z.enum(["LEAD", "CUSTOMER"]),
    assignedSalesUserId: z.string().trim().optional().transform((value) => value || ""),
    sectorValueId: z.string().trim().optional().transform((value) => value || ""),
    productionGroupValueId: z.string().trim().optional().transform((value) => value || ""),
    usageAreaValueId: z.string().trim().optional().transform((value) => value || ""),
    generalDiscountPercent: optionalNullableNumber({
        min: 0,
        max: 100,
        message: "Genel iskonto 0 ile 100 arasında olmalıdır",
    }),
    defaultPaymentTermDays: optionalNullableNumber({
        min: 0,
        integer: true,
        message: "Vade gün sayısı 0 veya pozitif tam sayı olmalıdır",
    }),
    creditLimit: optionalNullableNumber({
        min: 0,
        message: "Kredi limiti 0 veya pozitif olmalıdır",
    }),
    paymentTermNote: optionalText(5000),
})

export type CustomerEditorFormInput = z.input<typeof customerEditorSchema>
export type CustomerEditorFormValues = z.output<typeof customerEditorSchema>

export function createCustomerEditorDefaults(customer?: AdminCustomer | null): CustomerEditorFormInput {
    return {
        companyName: customer?.companyName ?? "",
        fullName: customer?.fullName ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
        note: customer?.note ?? "",
        status: customer?.status ?? "LEAD",
        assignedSalesUserId: customer?.assignedSalesUserId ?? "",
        sectorValueId: customer?.sectorValueId ?? "",
        productionGroupValueId: customer?.productionGroupValueId ?? "",
        usageAreaValueId: customer?.usageAreaValues?.[0]?.id ?? "",
        generalDiscountPercent: customer?.generalDiscountPercent ?? null,
        defaultPaymentTermDays: customer?.defaultPaymentTermDays ?? null,
        creditLimit: customer?.creditLimit ?? null,
        paymentTermNote: customer?.paymentTermNote ?? "",
    }
}

export function buildCustomerUpdatePayload(customerId: string, values: CustomerEditorFormValues): UpdateCustomerInput {
    return {
        id: customerId,
        companyName: values.companyName || null,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        note: values.note || null,
        status: values.status,
        assignedSalesUserId: values.assignedSalesUserId || null,
        sectorValueId: values.sectorValueId || null,
        productionGroupValueId: values.productionGroupValueId || null,
        usageAreaValueIds: values.usageAreaValueId ? [values.usageAreaValueId] : [],
        generalDiscountPercent: values.generalDiscountPercent,
        defaultPaymentTermDays: values.defaultPaymentTermDays,
        creditLimit: values.creditLimit,
        paymentTermNote: values.paymentTermNote || null,
    }
}
