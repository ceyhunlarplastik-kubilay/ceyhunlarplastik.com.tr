import { prisma } from "@/core/db/prisma"

export interface IPrismaGeoRepository {
    listCountries(): Promise<Awaited<ReturnType<typeof prisma.geoCountry.findMany>>>
    listStatesByCountry(countryId: number): Promise<Awaited<ReturnType<typeof prisma.geoState.findMany>>>
    listCitiesByState(stateId: number): Promise<Awaited<ReturnType<typeof prisma.geoCity.findMany>>>
}

export const geoRepository = (): IPrismaGeoRepository => {
    const listCountries = async () =>
        prisma.geoCountry.findMany({
            orderBy: { name: "asc" },
        })

    const listStatesByCountry = async (countryId: number) =>
        prisma.geoState.findMany({
            where: { countryId },
            orderBy: { name: "asc" },
        })

    const listCitiesByState = async (stateId: number) =>
        prisma.geoCity.findMany({
            where: { stateId },
            orderBy: { name: "asc" },
        })

    return {
        listCountries,
        listStatesByCountry,
        listCitiesByState,
    }
}
