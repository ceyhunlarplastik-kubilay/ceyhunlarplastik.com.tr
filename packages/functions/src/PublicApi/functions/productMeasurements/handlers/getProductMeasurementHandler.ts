import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductMeasurementDependencies, IGetProductMeasurementEvent } from "@/functions/PublicApi/types/productMeasurements"

export const getProductMeasurementHandler = ({ productMeasurementRepository }: IProductMeasurementDependencies) => {
    return async (event: IGetProductMeasurementEvent) => {

        const { id } = event.pathParameters;

        try {
            const measurement = await productMeasurementRepository.getProductMeasurement(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { productMeasurement: measurement },
            });
        } catch (err) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Product measurement not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get product measurement");
        }
    }
}
