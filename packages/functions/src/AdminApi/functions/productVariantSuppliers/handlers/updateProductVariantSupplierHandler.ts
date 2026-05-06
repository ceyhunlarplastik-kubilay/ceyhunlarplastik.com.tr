import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IUpdateProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

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
                ...resolveProductVariantSupplierPricing(
                    { price, operationalCostRate, netCost, profitRate, listPrice },
                    {
                        operationalCostRate: existing.operationalCostRate,
                        profitRate: existing.profitRate,
                    }
                ),
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
