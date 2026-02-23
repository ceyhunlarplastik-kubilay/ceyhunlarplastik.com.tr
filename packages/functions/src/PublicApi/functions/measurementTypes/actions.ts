
import { lambdaHandler } from "@/core/middy"
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import { getMeasurementTypeHandler, listMeasurementTypesHandler } from "@/functions/PublicApi/functions/measurementTypes/handlers";
import {
    idValidator,
    measurementTypeResponseValidator,
    listMeasurementTypeResponseValidator,
} from "@/functions/PublicApi/validators/measurementTypes"
import type {
    IMeasurementTypeDependencies,
    IGetMeasurementTypeEvent,
    IListMeasurementTypesEvent,
} from "@/functions/PublicApi/types/measurementTypes"

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
        auth: false,
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
        auth: false,
        responseValidator: listMeasurementTypeResponseValidator,
    }
)
