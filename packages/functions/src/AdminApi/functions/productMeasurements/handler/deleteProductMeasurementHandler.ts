import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IProductMeasurementDependencies, IDeleteProductMeasurementEvent } from "@/functions/AdminApi/types/productMeasurements"

export const deleteProductMeasurementHandler = ({ productMeasurementRepository }: IProductMeasurementDependencies) => {
    return async (event: IDeleteProductMeasurementEvent) => {
        const { id } = event.pathParameters;

        try {
            const deleted = await productMeasurementRepository.deleteProductMeasurement(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { productMeasurement: deleted },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("ProductMeasurement not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product measurement");
        }
    }
}
