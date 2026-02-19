import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IGetMeasurementTypeDependencies,
    IGetMeasurementTypeEvent,
} from "@/functions/AdminApi/types/measurementTypes"

export const getMeasurementTypeHandler = ({ measurementTypeRepository }: IGetMeasurementTypeDependencies) => {
    return async (event: IGetMeasurementTypeEvent) => {
        const { id } = event.pathParameters;

        try {
            const measurementType = await measurementTypeRepository.getMeasurementType(id);

            if (!measurementType) throw new createError.NotFound("Measurement type not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { measurementType },
            });
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            console.error(err);
            throw new createError.InternalServerError("Failed to get measurement type");
        }
    }
}

