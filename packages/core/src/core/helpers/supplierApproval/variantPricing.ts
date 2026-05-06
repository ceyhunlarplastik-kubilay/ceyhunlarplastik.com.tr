import { Prisma } from "@/prisma/generated/prisma/client"
import type { ProductVariantSupplierWithRelations } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import type { SupplierVariantPricingApprovalPayload } from "@/core/helpers/supplierApproval/types"
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier"

export function buildApprovedVariantPricingUpdate(
    existing: ProductVariantSupplierWithRelations,
    input: SupplierVariantPricingApprovalPayload
): Prisma.ProductVariantSupplierUpdateInput {
    const {
        price,
        operationalCostRate,
        netCost,
        profitRate,
        listPrice,
        paymentTermDays,
        supplierVariantCode,
        supplierNote,
        minOrderQty,
        stockQty,
        currency,
    } = input

    const pricing = resolveProductVariantSupplierPricing(
        {
            price,
            operationalCostRate,
            netCost,
            profitRate,
            listPrice,
        },
        {
            operationalCostRate: existing.operationalCostRate,
            profitRate: existing.profitRate,
        }
    )

    return {
        ...pricing,
        ...(typeof paymentTermDays === "number" ? { paymentTermDays } : {}),
        ...(supplierVariantCode !== undefined ? { supplierVariantCode: supplierVariantCode.trim() } : {}),
        ...(supplierNote !== undefined ? { supplierNote: supplierNote.trim() } : {}),
        ...(typeof minOrderQty === "number" ? { minOrderQty } : {}),
        ...(typeof stockQty === "number" ? { stockQty } : {}),
        ...((typeof minOrderQty === "number" || typeof stockQty === "number")
            ? { availabilityUpdatedAt: new Date() }
            : {}),
        ...(currency ? { currency: currency.toUpperCase() } : {}),
    }
}
