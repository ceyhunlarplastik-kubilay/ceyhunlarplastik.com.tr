import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IDeleteSupplierDependencies, IDeleteSupplierEvent } from "@/functions/AdminApi/types/suppliers"

export const deleteSupplierHandler = ({ supplierRepository }: IDeleteSupplierDependencies) => {
  return async (event: IDeleteSupplierEvent) => {

    const id = event.pathParameters?.id

    if (!id) throw new createError.BadRequest("Supplier id is required")

    try {
      // Soft delete via prisma extension
      const supplier = await supplierRepository.deleteSupplier(id)

      return apiResponseDTO({
        statusCode: 200,
        payload: { supplier },
      })

    } catch (err: any) {
      if (err instanceof HttpError) throw err
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") throw new createError.NotFound("Supplier not found")
      }
      console.error(err)
      throw new createError.InternalServerError("Failed to delete supplier")
    }
  }
}
