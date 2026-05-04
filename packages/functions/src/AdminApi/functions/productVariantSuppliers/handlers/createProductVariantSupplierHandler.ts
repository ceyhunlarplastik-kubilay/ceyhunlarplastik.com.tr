import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, ICreateProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

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

export const createProductVariantSupplierHandler = ({ productVariantSupplierRepository, productVariantRepository, supplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: ICreateProductVariantSupplierEvent) => {
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
            const variant = await productVariantRepository.getProductVariant(variantId)
            if (!variant) throw new createError.NotFound("Variant not found");

            const supplier = await supplierRepository.getSupplier(supplierId)
            if (!supplier) throw new createError.NotFound("Supplier not found");

            const created = await productVariantSupplierRepository.createProductVariantSupplier({
                variant: { connect: { id: variantId } },
                supplier: { connect: { id: supplierId } },
                isActive: isActive ?? false,
                ...resolvePricingFields({ price, operationalCostRate, netCost, profitRate, listPrice }),
                ...(typeof paymentTermDays === "number" && { paymentTermDays }),
                ...(supplierVariantCode && { supplierVariantCode: supplierVariantCode.trim() }),
                ...(supplierNote && { supplierNote: supplierNote.trim() }),
                ...(typeof minOrderQty === "number" && { minOrderQty }),
                ...(typeof stockQty === "number" && { stockQty }),
                ...((typeof minOrderQty === "number" || typeof stockQty === "number") && {
                    availabilityUpdatedAt: new Date(),
                }),
                ...(currency && { currency: currency.toUpperCase() }),
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { productVariantSupplier: created },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("This supplier is already assigned to this variant");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create product variant supplier");
        }
    }
}
