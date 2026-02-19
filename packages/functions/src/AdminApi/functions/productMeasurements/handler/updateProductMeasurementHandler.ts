import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductMeasurementDependencies, IUpdateProductMeasurementEvent } from "@/functions/AdminApi/types/productMeasurements"
import { Prisma } from "@/prisma/generated/prisma/client"

export const updateProductMeasurementHandler = ({ productMeasurementRepository, productVariantRepository, measurementTypeRepository }: IProductMeasurementDependencies) => {
    return async (event: IUpdateProductMeasurementEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await productMeasurementRepository.getProductMeasurement(id);
            if (!existing) throw new createError.NotFound("Measurement not found");

            if (body.variantId) {
                const variant = await productVariantRepository.getProductVariant(body.variantId);
                if (!variant) throw new createError.NotFound("ProductVariant not found");
            }

            if (body.measurementTypeId) {
                const type = await measurementTypeRepository.getMeasurementType(body.measurementTypeId);
                if (!type) throw new createError.NotFound("MeasurementType not found");
            }

            const updated = await productMeasurementRepository.updateProductMeasurement(id, {
                ...body,
                ...(body.variantId && { variant: { connect: { id: body.variantId } } }),
                ...(body.measurementTypeId && { measurementType: { connect: { id: body.measurementTypeId } } }),
            });

            return apiResponseDTO({
                statusCode: 200,
                payload: { productMeasurement: updated },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Measurement already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update product measurement");
        }
    }
}
