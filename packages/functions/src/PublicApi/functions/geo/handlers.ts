import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGeoDependencies, IListCitiesEvent, IListCountriesEvent, IListStatesEvent } from "@/functions/PublicApi/types/geo"

const toSerializableGeoRecord = <T extends Record<string, unknown>>(record: T) => {
    return Object.fromEntries(
        Object.entries(record).map(([key, value]) => {
            if (typeof value === "bigint") return [key, value.toString()]
            if (typeof value === "object" && value && "toJSON" in value && typeof value.toJSON === "function") {
                return [key, value.toJSON()]
            }
            return [key, value]
        }),
    )
}

export const listCountriesHandler = ({ geoRepository }: IGeoDependencies) => {
    return async (_event: IListCountriesEvent) => {
        const data = (await geoRepository.listCountries()).map(toSerializableGeoRecord)
        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        })
    }
}

export const listStatesHandler = ({ geoRepository }: IGeoDependencies) => {
    return async (event: IListStatesEvent) => {
        const countryId = Number(event.pathParameters?.countryId)
        if (!countryId) throw new createError.BadRequest("Country id is required")

        const data = (await geoRepository.listStatesByCountry(countryId)).map(toSerializableGeoRecord)
        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        })
    }
}

export const listCitiesHandler = ({ geoRepository }: IGeoDependencies) => {
    return async (event: IListCitiesEvent) => {
        const stateId = Number(event.pathParameters?.stateId)
        if (!stateId) throw new createError.BadRequest("State id is required")

        const data = (await geoRepository.listCitiesByState(stateId)).map(toSerializableGeoRecord)
        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        })
    }
}
