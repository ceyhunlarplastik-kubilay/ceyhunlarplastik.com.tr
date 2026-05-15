import { lambdaHandler } from "@/core/middy";
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository";
import { createMeasurementTypeHandler, getMeasurementTypeHandler, listMeasurementTypesHandler, deleteMeasurementTypeHandler, updateMeasurementTypeHandler, } from "@/functions/AdminApi/functions/measurementTypes/handlers";
import { idValidator, createMeasurementTypeValidator, updateMeasurementTypeValidator, measurementTypeResponseValidator, listMeasurementTypeResponseValidator, } from "@/functions/AdminApi/validators/measurementTypes";
export const createMeasurementType = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return createMeasurementTypeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createMeasurementTypeValidator,
    responseValidator: measurementTypeResponseValidator,
});
export const getMeasurementType = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return getMeasurementTypeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: idValidator,
    responseValidator: measurementTypeResponseValidator,
});
export const listMeasurementTypes = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return listMeasurementTypesHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: listMeasurementTypeResponseValidator,
});
export const deleteMeasurementType = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return deleteMeasurementTypeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: idValidator,
    responseValidator: measurementTypeResponseValidator,
});
export const updateMeasurementType = lambdaHandler(async (event) => {
    const deps = {
        measurementTypeRepository: measurementTypeRepository()
    };
    return updateMeasurementTypeHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: updateMeasurementTypeValidator,
    responseValidator: measurementTypeResponseValidator,
});
