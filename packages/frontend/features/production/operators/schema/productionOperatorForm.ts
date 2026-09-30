import { z } from "zod"

import type { ProductionOperator, ProductionOperatorInput } from "@/features/production/operators/api/types"

export const productionOperatorFormSchema = z.object({
    firstName: z.string().trim().min(1, "Ad zorunlu").max(80, "En fazla 80 karakter"),
    lastName: z.string().trim().min(1, "Soyad zorunlu").max(80, "En fazla 80 karakter"),
    employeeNo: z.string().trim().max(30, "En fazla 30 karakter"),
    phone: z.string().trim().max(40, "En fazla 40 karakter"),
    isActive: z.boolean(),
    notes: z.string().trim().max(2000, "En fazla 2000 karakter"),
})

export type ProductionOperatorFormValues = z.infer<typeof productionOperatorFormSchema>

export function createProductionOperatorFormDefaults(operator?: ProductionOperator | null): ProductionOperatorFormValues {
    return {
        firstName: operator?.firstName ?? "",
        lastName: operator?.lastName ?? "",
        employeeNo: operator?.employeeNo ?? "",
        phone: operator?.phone ?? "",
        isActive: operator?.isActive ?? true,
        notes: operator?.notes ?? "",
    }
}

/** Boş metin → `null` (alanı temizler). Sicil numarası sunucuda büyük harfe çevrilir. */
export function buildProductionOperatorPayload(values: ProductionOperatorFormValues): ProductionOperatorInput {
    return {
        firstName: values.firstName,
        lastName: values.lastName,
        employeeNo: values.employeeNo || null,
        phone: values.phone || null,
        isActive: values.isActive,
        notes: values.notes || null,
    }
}
