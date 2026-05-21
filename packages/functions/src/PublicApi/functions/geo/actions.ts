import { lambdaHandler } from "@/core/middy"
import { geoRepository } from "@/core/helpers/prisma/geo/repository"
import { listCitiesHandler, listCountriesHandler, listStatesHandler } from "@/functions/PublicApi/functions/geo/handlers"
import { countryIdValidator, listCitiesResponseValidator, listCountriesResponseValidator, listStatesResponseValidator, stateIdValidator } from "@/functions/PublicApi/validators/geo"
import type { IGeoDependencies, IListCitiesEvent, IListCountriesEvent, IListStatesEvent } from "@/functions/PublicApi/types/geo"

const deps: IGeoDependencies = {
    geoRepository: geoRepository(),
}

export const listCountries = lambdaHandler(
    async (event) => listCountriesHandler(deps)(event as IListCountriesEvent),
    {
        auth: false,
        responseValidator: listCountriesResponseValidator,
    },
)

export const listStates = lambdaHandler(
    async (event) => listStatesHandler(deps)(event as IListStatesEvent),
    {
        auth: false,
        requestValidator: countryIdValidator,
        responseValidator: listStatesResponseValidator,
    },
)

export const listCities = lambdaHandler(
    async (event) => listCitiesHandler(deps)(event as IListCitiesEvent),
    {
        auth: false,
        requestValidator: stateIdValidator,
        responseValidator: listCitiesResponseValidator,
    },
)
