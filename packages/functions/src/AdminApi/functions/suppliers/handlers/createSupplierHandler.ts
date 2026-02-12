import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateSupplierDependencies, ICreateSupplierEvent } from "@/functions/AdminApi/types/suppliers"

export const createSupplierHandler = ({ supplierRepository }: ICreateSupplierDependencies) => {
    return async (event: ICreateSupplierEvent) => {

        const body = event.body

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least one body field must be provided");

        const allowedFields = ["name", "isActive"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { name, isActive } = body;

        try {
            const supplier = await supplierRepository.createSupplier({
                name,
                ...(isActive !== undefined ? { isActive } : {}),
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { supplier },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    throw new createError.Conflict("Supplier name already exists")
                }
            }
            console.error(err)
            throw new createError.InternalServerError("Failed to create supplier")
        }
    }
}
