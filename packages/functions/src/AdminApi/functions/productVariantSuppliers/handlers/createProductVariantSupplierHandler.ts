import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantSupplierDependencies, ICreateProductVariantSupplierEvent } from "@/functions/AdminApi/types/productVariantSuppliers"

export const createProductVariantSupplierHandler = ({ productVariantSupplierRepository, productVariantRepository, supplierRepository }: IProductVariantSupplierDependencies) => {
    return async (event: ICreateProductVariantSupplierEvent) => {
        const { variantId, supplierId, isActive, price, currency } = event.body;

        try {
            const variant = await productVariantRepository.getProductVariant(variantId)
            if (!variant) throw new createError.NotFound("Variant not found");

            const supplier = await supplierRepository.getSupplier(supplierId)
            if (!supplier) throw new createError.NotFound("Supplier not found");

            const created = await productVariantSupplierRepository.createProductVariantSupplier({
                variant: { connect: { id: variantId } },
                supplier: { connect: { id: supplierId } },
                isActive: isActive ?? false,
                ...(price !== undefined && { price }),
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
