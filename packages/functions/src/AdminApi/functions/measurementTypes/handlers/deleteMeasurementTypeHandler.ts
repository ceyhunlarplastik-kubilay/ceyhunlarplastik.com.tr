import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IDeleteMeasurementTypeDependencies, IDeleteMeasurementTypeEvent } from "@/functions/AdminApi/types/measurementTypes"

export const deleteMeasurementTypeHandler = ({ measurementTypeRepository }: IDeleteMeasurementTypeDependencies) => {
    return async (event: IDeleteMeasurementTypeEvent) => {

        const { id } = event.pathParameters

        try {
            const measurementType = await measurementTypeRepository.getMeasurementType(id);
            if (!measurementType) throw new createError.NotFound("Measurement type not found");

            // ⚠️ Eğer foreign key varsa Prisma zaten P2003 atar
            await measurementTypeRepository.deleteMeasurementType(id)

            return apiResponseDTO({
                statusCode: 200,
                payload: { measurementType },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err.code === "P2003") throw new createError.Conflict("Measurement type is used by products and cannot be deleted");
            console.error(err)
            throw new createError.InternalServerError("Failed to delete measurement type");
        }
    }
}
