
import { lambdaHandler } from "@/core/middy"
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import {
    createMeasurementTypeHandler,
    getMeasurementTypeHandler,
    listMeasurementTypesHandler,
    deleteMeasurementTypeHandler,
    updateMeasurementTypeHandler,
} from "@/functions/AdminApi/functions/measurementTypes/handlers";
import {
    idValidator,
    createMeasurementTypeValidator,
    updateMeasurementTypeValidator,
    measurementTypeResponseValidator,
    listMeasurementTypeResponseValidator,
} from "@/functions/AdminApi/validators/measurementTypes"
import type {
    IMeasurementTypeDependencies,
    ICreateMeasurementTypeEvent,
    IGetMeasurementTypeEvent,
    IListMeasurementTypesEvent,
    IDeleteMeasurementTypeEvent,
    IUpdateMeasurementTypeEvent,
} from "@/functions/AdminApi/types/measurementTypes"

export const createMeasurementType = lambdaHandler(
    async (event) => {
        const deps: IMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return createMeasurementTypeHandler(deps)(
            event as ICreateMeasurementTypeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createMeasurementTypeValidator,
        responseValidator: measurementTypeResponseValidator,
    }
)

export const getMeasurementType = lambdaHandler(
    async (event) => {
        const deps: IMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return getMeasurementTypeHandler(deps)(
            event as IGetMeasurementTypeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: measurementTypeResponseValidator,
    }
)

export const listMeasurementTypes = lambdaHandler(
    async (event) => {
        const deps: IMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return listMeasurementTypesHandler(deps)
            (
                event as IListMeasurementTypesEvent
            )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listMeasurementTypeResponseValidator,
    }
)

export const deleteMeasurementType = lambdaHandler(
    async (event) => {
        const deps: IMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return deleteMeasurementTypeHandler(deps)(
            event as IDeleteMeasurementTypeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: measurementTypeResponseValidator,
    }
)

export const updateMeasurementType = lambdaHandler(
    async (event) => {
        const deps: IMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return updateMeasurementTypeHandler(deps)(
            event as IUpdateMeasurementTypeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateMeasurementTypeValidator,
        responseValidator: measurementTypeResponseValidator,
    }
)
