import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IUpdateProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

function resolvePricingFields(input: {
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
}) {
    const result: {
        price?: number
        operationalCostRate?: number
        netCost?: number
        profitRate?: number
        listPrice?: number
    } = {}
    const hasPrice = typeof input.price === "number" && Number.isFinite(input.price)
    const hasOperationalRate = typeof input.operationalCostRate === "number" && Number.isFinite(input.operationalCostRate)
    const hasNetCost = typeof input.netCost === "number" && Number.isFinite(input.netCost)
    const hasProfitRate = typeof input.profitRate === "number" && Number.isFinite(input.profitRate)
    const hasListPrice = typeof input.listPrice === "number" && Number.isFinite(input.listPrice)

    if (hasPrice) result.price = input.price
    if (hasOperationalRate) result.operationalCostRate = input.operationalCostRate
    if (hasNetCost) result.netCost = input.netCost
    if (hasProfitRate) result.profitRate = input.profitRate
    if (hasListPrice) result.listPrice = input.listPrice

    const resolvedNetCost =
        hasNetCost
            ? input.netCost!
            : hasPrice
                ? input.price! * (1 + (input.operationalCostRate ?? 0) / 100)
                : undefined

    if (resolvedNetCost !== undefined) result.netCost = resolvedNetCost

    const shouldRecomputeListPriceFromProfit =
        hasProfitRate && resolvedNetCost !== undefined && (hasPrice || hasOperationalRate || hasNetCost)

    if (shouldRecomputeListPriceFromProfit) {
        result.listPrice = resolvedNetCost! * (1 + input.profitRate! / 100)
    } else if (!hasListPrice && hasProfitRate && resolvedNetCost !== undefined) {
        result.listPrice = resolvedNetCost * (1 + input.profitRate! / 100)
    } else if (!hasProfitRate && hasListPrice && resolvedNetCost !== undefined && resolvedNetCost > 0) {
        result.profitRate = ((input.listPrice! - resolvedNetCost) / resolvedNetCost) * 100
    }

    if (hasPrice || hasOperationalRate || hasNetCost || hasProfitRate || hasListPrice) {
        ; (result as any).pricingUpdatedAt = new Date()
    }

    return result
}

export const updateProductVariantSupplierHandler = ({ productVariantSupplierRepository, productVariantRepository, supplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IUpdateProductVariantSupplierEvent) => {
        const { id } = event.pathParameters;
        const {
            variantId,
            supplierId,
            isActive,
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
        } = event.body;

        try {
            const existing = await productVariantSupplierRepository.getProductVariantSupplier(id);
            if (!existing) throw new createError.NotFound("Record not found");

            if (variantId) {
                const variant = await productVariantRepository.getProductVariant(variantId)
                if (!variant) throw new createError.NotFound("Variant not found");
            }
            if (supplierId) {
                const supplier = await supplierRepository.getSupplier(supplierId)
                if (!supplier) throw new createError.NotFound("Supplier not found");
            }

            const updated = await productVariantSupplierRepository.updateProductVariantSupplier(id, {
                ...(variantId && { variant: { connect: { id: variantId } } }),
                ...(supplierId && { supplier: { connect: { id: supplierId } } }),
                ...(isActive !== undefined && { isActive }),
                ...resolvePricingFields({ price, operationalCostRate, netCost, profitRate, listPrice }),
                ...(typeof paymentTermDays === "number" && { paymentTermDays }),
                ...(supplierVariantCode !== undefined && { supplierVariantCode: supplierVariantCode.trim() }),
                ...(supplierNote !== undefined && { supplierNote: supplierNote.trim() }),
                ...(typeof minOrderQty === "number" && { minOrderQty }),
                ...(typeof stockQty === "number" && { stockQty }),
                ...((typeof minOrderQty === "number" || typeof stockQty === "number") && {
                    availabilityUpdatedAt: new Date(),
                }),
                ...(currency && { currency: currency.toUpperCase() }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariantSupplier: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("This supplier is already assigned to this variant");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update product variant supplier");
        }
    }
}
