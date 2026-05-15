import createError, { HttpError } from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const createProductVariantSupplierHandler = ({ productVariantSupplierRepository, productVariantRepository, supplierRepository }) => {
    return async (event) => {
        const { variantId, supplierId, isActive, price, operationalCostRate, netCost, profitRate, listPrice, paymentTermDays, supplierVariantCode, supplierNote, minOrderQty, stockQty, currency, } = event.body;
        try {
            const variant = await productVariantRepository.getProductVariant(variantId);
            if (!variant)
                throw new createError.NotFound("Variant not found");
            const supplier = await supplierRepository.getSupplier(supplierId);
            if (!supplier)
                throw new createError.NotFound("Supplier not found");
            const created = await productVariantSupplierRepository.createProductVariantSupplier({
                variant: { connect: { id: variantId } },
                supplier: { connect: { id: supplierId } },
                isActive: isActive ?? false,
                ...resolveProductVariantSupplierPricing({ price, operationalCostRate, netCost, profitRate, listPrice }),
                ...(typeof paymentTermDays === "number" && { paymentTermDays }),
                ...(supplierVariantCode && { supplierVariantCode: supplierVariantCode.trim() }),
                ...(supplierNote && { supplierNote: supplierNote.trim() }),
                ...(typeof minOrderQty === "number" && { minOrderQty }),
                ...(typeof stockQty === "number" && { stockQty }),
                ...((typeof minOrderQty === "number" || typeof stockQty === "number") && {
                    availabilityUpdatedAt: new Date(),
                }),
                ...(currency && { currency: currency.toUpperCase() }),
            });
            return apiResponseDTO({
                statusCode: 201,
                payload: { productVariantSupplier: created },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("This supplier is already assigned to this variant");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create product variant supplier");
        }
    };
};
