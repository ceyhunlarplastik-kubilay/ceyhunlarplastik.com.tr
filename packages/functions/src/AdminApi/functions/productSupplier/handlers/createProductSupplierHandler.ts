import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { ICreateProductSupplierDependencies, ICreateProductSupplierEvent } from "@/functions/AdminApi/types/productSuppliers"

export const createProductSupplierHandler = ({ productSupplierRepository }: ICreateProductSupplierDependencies) => {
    return async (event: ICreateProductSupplierEvent) => {

        const body = event.body;

        if (!body) throw new createError.BadRequest("Request body required");

        const { productId, supplierId, catalogCode } = body;

        if (!productId || !supplierId || !catalogCode) {
            throw new createError.BadRequest("productId, supplierId and catalogCode are required");
        }

        try {
            const productSupplier =
                await productSupplierRepository.createProductSupplier({
                    product: { connect: { id: productId } },
                    supplier: { connect: { id: supplierId } },
                    catalogCode,
                })

            return apiResponseDTO({
                statusCode: 201,
                payload: { productSupplier },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    const target = (err.meta?.target as string[])?.join(", ");

                    if (target?.includes("productId_supplierId")) throw new createError.Conflict("Supplier already linked to this product");
                    else if (target?.includes("productId_catalogCode")) throw new createError.Conflict("catalogCode already exists for this product");
                    else throw new createError.Conflict("Unique constraint violation");
                }
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create product supplier");
        }
    }
}

