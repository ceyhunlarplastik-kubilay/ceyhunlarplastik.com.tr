import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductMeasurementDependencies, ICreateProductMeasurementEvent } from "@/functions/AdminApi/types/productMeasurements"

export const createProductMeasurementHandler = ({ productMeasurementRepository, productVariantRepository, measurementTypeRepository }: IProductMeasurementDependencies) => {
    return async (event: ICreateProductMeasurementEvent) => {
        const { variantId, measurementTypeId, value, label } = event.body;

        try {
            const variant = await productVariantRepository.getProductVariant(variantId)
            if (!variant) throw new createError.NotFound("ProductVariant not found");

            const measurementType = await measurementTypeRepository.getMeasurementType(measurementTypeId)
            if (!measurementType) throw new createError.NotFound("MeasurementType not found");

            const measurement = await productMeasurementRepository.createProductMeasurement({
                variant: { connect: { id: variantId } },
                measurementType: { connect: { id: measurementTypeId } },
                value,
                label: label || "",
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { productMeasurement: measurement },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Measurement already exists for this variant, type and label");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create product measurement");
        }
    }
}
