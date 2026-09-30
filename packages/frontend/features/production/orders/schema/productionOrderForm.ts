import { z } from "zod"

import { findProductionOrderIssues, MAX_PRODUCTION_ORDER_QUANTITY } from "@core/helpers/production/productionOrders"
import type { ProductionOrder, ProductionOrderInput } from "@/features/production/orders/api/types"
import {
    optionalDecimalField,
    requiredIntegerField,
    toFieldText,
} from "@/features/production/shared/formNumbers"

/**
 * Üretim emri formu. `productId` ve `customerName` yalnız arayüz içindir (seçicileri
 * doldurur). Çapraz kurallar sunucudakiyle AYNI fonksiyon: core `findProductionOrderIssues`.
 */
export const productionOrderFormSchema = z.object({
    productId: z.string(),
    productVariantId: z.string().min(1, "Varyant seçin"),
    quantity: requiredIntegerField("Adet", { min: 1, max: MAX_PRODUCTION_ORDER_QUANTITY }),
    /** `<input type="date">`: "YYYY-MM-DD" ya da boş. */
    dueDate: z.string(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    source: z.enum(["MANUAL", "STOCK", "CUSTOMER_ORDER"]),
    customerId: z.string(),
    customerName: z.string(),
    cycleTimeOverrideSec: optionalDecimalField("Elle çevrim", { min: 0.1, max: 3600 }),
    notes: z.string().trim().max(5000, "En fazla 5000 karakter"),
}).superRefine((values, ctx) => {
    for (const issue of findProductionOrderIssues({
        quantity: values.quantity,
        dueDate: values.dueDate || null,
        source: values.source,
        customerId: values.customerId || null,
        cycleTimeOverrideSec: values.cycleTimeOverrideSec,
    })) {
        ctx.addIssue({ code: "custom", path: [issue.field], message: issue.message })
    }
})

export type ProductionOrderFormInput = z.input<typeof productionOrderFormSchema>
export type ProductionOrderFormValues = z.output<typeof productionOrderFormSchema>

export function createProductionOrderFormDefaults(order?: ProductionOrder | null): ProductionOrderFormInput {
    return {
        productId: order?.productVariant?.product.id ?? "",
        productVariantId: order?.productVariantId ?? "",
        quantity: toFieldText(order?.quantity),
        dueDate: order?.dueDate ?? "",
        priority: order?.priority ?? "NORMAL",
        source: order?.source ?? "MANUAL",
        customerId: order?.customerId ?? "",
        customerName: order?.customer?.name ?? "",
        cycleTimeOverrideSec: toFieldText(order?.cycleTimeOverrideSec),
        notes: order?.notes ?? "",
    }
}

export function buildProductionOrderPayload(values: ProductionOrderFormValues): ProductionOrderInput {
    return {
        productVariantId: values.productVariantId,
        quantity: values.quantity,
        dueDate: values.dueDate || null,
        priority: values.priority,
        source: values.source,
        customerId: values.customerId || null,
        cycleTimeOverrideSec: values.cycleTimeOverrideSec,
        notes: values.notes || null,
    }
}
