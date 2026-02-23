import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, IUpdateProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

export const updateProductVariantSupplierHandler = ({ productVariantSupplierRepository, productVariantRepository, supplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: IUpdateProductVariantSupplierEvent) => {
        const { id } = event.pathParameters;
        const { variantId, supplierId, isActive } = event.body;

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
