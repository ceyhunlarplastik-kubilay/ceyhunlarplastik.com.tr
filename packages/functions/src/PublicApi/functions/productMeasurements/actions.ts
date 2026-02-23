import { lambdaHandler } from "@/core/middy"
import { productMeasurementRepository } from "@/core/helpers/prisma/productMeasurements/repository"
import { getProductMeasurementHandler, listProductMeasurementsHandler } from "@/functions/PublicApi/functions/productMeasurements/handlers"
import { IGetProductMeasurementEvent, IListProductMeasurementsEvent } from "@/functions/PublicApi/types/productMeasurements"
import { idValidator, productMeasurementResponseValidator, listProductMeasurementsResponseValidator } from "@/functions/PublicApi/validators/productMeasurements"

export const listProductMeasurements = lambdaHandler(
    async (event) =>
        listProductMeasurementsHandler({
            productMeasurementRepository: productMeasurementRepository(),
        } as any)(event as IListProductMeasurementsEvent),
    {
        auth: false,
        responseValidator: listProductMeasurementsResponseValidator,
    }
)

export const getProductMeasurement = lambdaHandler(
    async (event) =>
        getProductMeasurementHandler({
            productMeasurementRepository: productMeasurementRepository(),
        } as any)(event as IGetProductMeasurementEvent),
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: productMeasurementResponseValidator,
    }
)