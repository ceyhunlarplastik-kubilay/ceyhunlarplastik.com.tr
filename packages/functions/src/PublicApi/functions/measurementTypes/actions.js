import { lambdaHandler } from "@/core/middy";
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository";
import { getMeasurementTypeHandler, listMeasurementTypesHandler } from "@/functions/PublicApi/functions/measurementTypes/handlers";
import { idValidator, measurementTypeResponseValidator, listMeasurementTypeResponseValidator, } from "@/functions/PublicApi/validators/measurementTypes";
export const getMeasurementType = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return getMeasurementTypeHandler(deps)(event);
}, {
    auth: false,
    requestValidator: idValidator,
    responseValidator: measurementTypeResponseValidator,
});
export const listMeasurementTypes = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return listMeasurementTypesHandler(deps)(event);
}, {
    auth: false,
    responseValidator: listMeasurementTypeResponseValidator,
});
