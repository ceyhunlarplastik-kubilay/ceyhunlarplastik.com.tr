import { z } from "zod"
import type { Supplier } from "@/features/admin/suppliers/api/types"

export const supplierEditorSchema = z.object({
    name: z.string().trim().min(1, "Firma adı zorunludur.").max(160),
    contactName: z.string().trim(),
    phone: z.string().trim(),
    address: z.string().trim(),
    taxNumber: z.string().trim(),
    defaultPaymentTermDays: z.string().trim().refine(
        (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 0),
        "Vade günü 0 veya daha büyük bir tam sayı olmalıdır.",
    ),
    assignedPurchasingUserIds: z.array(z.string()).max(500),
})

export type SupplierEditorFormValues = z.infer<typeof supplierEditorSchema>

/** Yeni tedarikçi formunun boş başlangıç değerleri. */
export function emptySupplierEditorFormValues(): SupplierEditorFormValues {
    return {
        name: "",
        contactName: "",
        phone: "",
        address: "",
        taxNumber: "",
        defaultPaymentTermDays: "",
        assignedPurchasingUserIds: [],
    }
}

export function toSupplierEditorFormValues(supplier: Supplier): SupplierEditorFormValues {
    return {
        name: supplier.name ?? "",
        contactName: supplier.contactName ?? "",
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
        taxNumber: supplier.taxNumber ?? "",
        defaultPaymentTermDays:
            supplier.defaultPaymentTermDays !== null &&
                supplier.defaultPaymentTermDays !== undefined
                ? String(supplier.defaultPaymentTermDays)
                : "",
        assignedPurchasingUserIds: (supplier.assignedPurchasingSuppliers ?? []).map((user) => user.id),
    }
}

/** Form değerlerini API alanlarına indirger (create + update ortak gövdesi). */
function toSupplierFieldPayload(values: SupplierEditorFormValues) {
    return {
        name: values.name.trim(),
        contactName: values.contactName.trim() || undefined,
        phone: values.phone.trim() || undefined,
        taxNumber: values.taxNumber.trim() || undefined,
        address: values.address.trim() || undefined,
        defaultPaymentTermDays: values.defaultPaymentTermDays
            ? Number(values.defaultPaymentTermDays)
            : undefined,
        assignedPurchasingUserIds: values.assignedPurchasingUserIds,
    }
}

export function buildSupplierUpdatePayload(
    supplierId: string,
    values: SupplierEditorFormValues,
) {
    return { id: supplierId, ...toSupplierFieldPayload(values) }
}

export function buildSupplierCreatePayload(values: SupplierEditorFormValues) {
    return { ...toSupplierFieldPayload(values), isActive: true }
}
