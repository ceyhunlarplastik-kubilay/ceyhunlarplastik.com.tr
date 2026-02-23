import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, ICreateMeasurementTypeEvent } from "@/functions/AdminApi/types/measurementTypes"

/* export const createMeasurementTypeHandler = ({ measurementTypeRepository }: ICreateMeasurementTypeDependencies) => {
    return async (event: ICreateMeasurementTypeEvent) => {

        const body = event.body

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least one body field must be provided");

        const allowedFields = ["name", "code", "unit"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { name, code, unit } = body;

        try {
            const measurementType = await measurementTypeRepository.createMeasurementType({
                name,
                code,
                unit,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { measurementType },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    throw new createError.Conflict("Measurement type name already exists")
                }
                if (err.code === "P2003") {
                    throw new createError.Conflict("Measurement type code already exists")
                }
            }
            console.error(err)
            throw new createError.InternalServerError("Failed to create measurement type")
        }
    }
} */

export const createMeasurementTypeHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: ICreateMeasurementTypeEvent) => {
        const { name, code, baseUnit, displayOrder } = event.body;

        try {
            const measurementType = await measurementTypeRepository.createMeasurementType({
                name,
                code,
                baseUnit,
                displayOrder,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { measurementType },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new createError.Conflict("Measurement type code already exists");
            console.error(err);
            throw new createError.InternalServerError("Failed to create measurement type");
        }
    }
}
