import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getProductMeasurementHandler = ({ productMeasurementRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const measurement = await productMeasurementRepository.getProductMeasurement(id);
            if (!measurement)
                throw new createError.NotFound("ProductMeasurement not found");
            return apiResponseDTO({
                statusCode: 200,
                payload: { productMeasurement: measurement },
            });
        }
        catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to get product measurement");
        }
    };
};
