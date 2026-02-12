import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IUpdateProductSupplierDependencies, IUpdateProductSupplierEvent } from "@/functions/AdminApi/types/productSuppliers"

// catalogCode update edilebilir yapıyoruz.
export const updateProductSupplierHandler = ({ productSupplierRepository }: IUpdateProductSupplierDependencies) => {
  return async (event: IUpdateProductSupplierEvent) => {

    const id = event.pathParameters?.id
    const body = event.body

    if (!id) throw new createError.BadRequest("ProductSupplier ID is required");
    if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least one field must be provided");

    const allowedFields = ["catalogCode"] as const

    const invalidFields = Object.keys(body).filter(
      key => !allowedFields.includes(key as any)
    )

    if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`);

    const { catalogCode } = body

    const updateData: Prisma.ProductSupplierUpdateInput = {
      ...(catalogCode !== undefined ? { catalogCode } : {}),
    }

    try {
      const productSupplier = await productSupplierRepository.updateProductSupplier(id, updateData);

      return apiResponseDTO({
        statusCode: 200,
        payload: { productSupplier },
      })
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") throw new createError.NotFound("ProductSupplier not found");
        if (err.code === "P2002") throw new createError.Conflict("catalogCode already exists for this product");
      }

      console.error(err)
      throw new createError.InternalServerError(
        "Failed to update product supplier"
      )
    }
  }
}

