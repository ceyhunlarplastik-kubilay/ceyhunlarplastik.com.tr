import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMeasurementTypeDependencies, IUpdateMeasurementTypeEvent } from "@/functions/AdminApi/types/measurementTypes"

export const updateMeasurementTypeHandler = ({ measurementTypeRepository }: IMeasurementTypeDependencies) => {
    return async (event: IUpdateMeasurementTypeEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const updated =
                await measurementTypeRepository.updateMeasurementType(id, {
                    ...body,
                })

            return apiResponseDTO({
                statusCode: 200,
                payload: { measurementType: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Measurement type not found");
                if (err.code === "P2002") throw new createError.Conflict("Measurement type code already exists");
            }
            console.error(err)
            throw new createError.InternalServerError("Failed to update measurement type");
        }
    }
}
