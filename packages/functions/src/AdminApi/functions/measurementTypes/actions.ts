
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
    createMeasurementTypeValidator,
    getMeasurementTypeValidator,
    deleteMeasurementTypeValidator,
    updateMeasurementTypeValidator,
    measurementTypeResponseValidator,
    listMeasurementTypeResponseValidator,
} from "@/functions/AdminApi/validators/measurementTypes"
import type {
    ICreateMeasurementTypeDependencies,
    ICreateMeasurementTypeEvent,
    IGetMeasurementTypeDependencies,
    IGetMeasurementTypeEvent,
    IListMeasurementTypesDependencies,
    IListMeasurementTypesEvent,
    IDeleteMeasurementTypeDependencies,
    IDeleteMeasurementTypeEvent,
    IUpdateMeasurementTypeDependencies,
    IUpdateMeasurementTypeEvent,
} from "@/functions/AdminApi/types/measurementTypes"

export const createMeasurementType = lambdaHandler(
    async (event) => {
        const deps: ICreateMeasurementTypeDependencies = {
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
        const deps: IGetMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return getMeasurementTypeHandler(deps)(
            event as IGetMeasurementTypeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: getMeasurementTypeValidator,
        responseValidator: measurementTypeResponseValidator,
    }
)

export const listMeasurementTypes = lambdaHandler(
    async (event) => {
        const deps: IListMeasurementTypesDependencies = {
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
        const deps: IDeleteMeasurementTypeDependencies = {
            measurementTypeRepository: measurementTypeRepository()
        }
        return deleteMeasurementTypeHandler(deps)(
            event as IDeleteMeasurementTypeEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: deleteMeasurementTypeValidator,
        responseValidator: measurementTypeResponseValidator,
    }
)

export const updateMeasurementType = lambdaHandler(
    async (event) => {
        const deps: IUpdateMeasurementTypeDependencies = {
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
