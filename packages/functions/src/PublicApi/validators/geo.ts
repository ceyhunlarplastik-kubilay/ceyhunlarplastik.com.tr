import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const countryIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            countryId: z.coerce.number().int().positive(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const stateIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            stateId: z.coerce.number().int().positive(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

const geoCountrySchema = z.object({
    id: z.number(),
    name: z.string(),
    iso2: z.string(),
    iso3: z.string().nullable().optional(),
}).loose()

const geoStateSchema = z.object({
    id: z.number(),
    name: z.string(),
    countryId: z.number(),
}).loose()

const geoCitySchema = z.object({
    id: z.number(),
    name: z.string(),
    countryId: z.number(),
    stateId: z.number().nullable().optional(),
}).loose()

export const listCountriesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(geoCountrySchema),
            }),
        }),
    }).loose(),
)

export const listStatesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(geoStateSchema),
            }),
        }),
    }).loose(),
)

export const listCitiesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(geoCitySchema),
            }),
        }),
    }).loose(),
)
