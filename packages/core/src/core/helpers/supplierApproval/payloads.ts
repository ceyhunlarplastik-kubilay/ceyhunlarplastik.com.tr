import type { Supplier } from "@/prisma/generated/prisma/client"
import type { ProductVariantSupplierWithRelations } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import type {
    SupplierProfileApprovalPayload,
    SupplierVariantPricingApprovalPayload,
} from "@/core/helpers/supplierApproval/types"

function toJsonSafe<T>(input: T): T {
    return JSON.parse(JSON.stringify(input)) as T
}

export function normalizeSupplierProfileApprovalPayload(input: SupplierProfileApprovalPayload): SupplierProfileApprovalPayload {
    return {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() } : {}),
        ...(input.taxNumber !== undefined ? { taxNumber: input.taxNumber.trim() } : {}),
        ...(input.defaultPaymentTermDays !== undefined
            ? { defaultPaymentTermDays: input.defaultPaymentTermDays }
            : {}),
    }
}

export function snapshotSupplierProfile(supplier: Supplier) {
    return toJsonSafe({
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        address: supplier.address,
        taxNumber: supplier.taxNumber,
        defaultPaymentTermDays: supplier.defaultPaymentTermDays,
    })
}

export function normalizeSupplierVariantPricingApprovalPayload(
    input: SupplierVariantPricingApprovalPayload
): SupplierVariantPricingApprovalPayload {
    return {
        ...input,
        ...(input.supplierVariantCode !== undefined
            ? { supplierVariantCode: input.supplierVariantCode.trim() }
            : {}),
        ...(input.supplierNote !== undefined ? { supplierNote: input.supplierNote.trim() } : {}),
        ...(input.currency ? { currency: input.currency.toUpperCase() } : {}),
    }
}

export function snapshotSupplierVariantPricing(existing: ProductVariantSupplierWithRelations) {
    return toJsonSafe({
        price: existing.price,
        operationalCostRate: existing.operationalCostRate,
        netCost: existing.netCost,
        profitRate: existing.profitRate,
        listPrice: existing.listPrice,
        paymentTermDays: existing.paymentTermDays,
        supplierVariantCode: existing.supplierVariantCode,
        supplierNote: existing.supplierNote,
        minOrderQty: existing.minOrderQty,
        stockQty: existing.stockQty,
        currency: existing.currency,
        pricingUpdatedAt: existing.pricingUpdatedAt,
        availabilityUpdatedAt: existing.availabilityUpdatedAt,
    })
}
