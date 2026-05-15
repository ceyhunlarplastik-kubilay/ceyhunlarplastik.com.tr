import createError, { HttpError } from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getMeasurementTypeHandler = ({ measurementTypeRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const measurementType = await measurementTypeRepository.getMeasurementType(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { measurementType },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Measurement type not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get measurement type");
        }
    };
};
