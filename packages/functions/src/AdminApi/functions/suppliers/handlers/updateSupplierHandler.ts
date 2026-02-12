import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IUpdateSupplierDependencies, IUpdateSupplierEvent } from "@/functions/AdminApi/types/suppliers"

export const updateSupplierHandler = ({ supplierRepository }: IUpdateSupplierDependencies) => {
    return async (event: IUpdateSupplierEvent) => {

        const id = event.pathParameters?.id
        const body = event.body

        if (!id) throw new createError.BadRequest("Supplier ID is required");
        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least one field must be provided");

        const allowedFields = ["name", "isActive"] as const

        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`);

        const { name, isActive } = body

        const updateData: Prisma.SupplierUpdateInput = {
            ...(name !== undefined && { name }),
            ...(isActive !== undefined && { isActive }),
        }

        try {
            const supplier = await supplierRepository.updateSupplier(id, updateData)

            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier },
            })

        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Supplier not found");
                if (err.code === "P2002") throw new createError.Conflict("Supplier name already exists");
            }
            console.error(err)
            throw new createError.InternalServerError("Failed to update supplier")
        }
    }
}
