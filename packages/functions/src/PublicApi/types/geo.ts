import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaGeoRepository } from "@/core/helpers/prisma/geo/repository"

export interface IGeoDependencies {
    geoRepository: IPrismaGeoRepository
}

export type IListCountriesEvent = IAPIGatewayProxyEventWithUserGeneric

export type IListStatesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { countryId: string }
>

export type IListCitiesEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    { stateId: string }
>
