import "dotenv/config"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "./generated/prisma/client"

type CountryCsvRow = {
    id: string
    name: string
    iso3?: string
    iso2: string
    numeric_code?: string
    phonecode?: string
    capital?: string
    currency?: string
    currency_name?: string
    currency_symbol?: string
    tld?: string
    native?: string
    population?: string
    gdp?: string
    region?: string
    region_id?: string
    subregion?: string
    subregion_id?: string
    nationality?: string
    area_sq_km?: string
    postal_code_format?: string
    postal_code_regex?: string
    timezones?: string
    latitude?: string
    longitude?: string
    emoji?: string
    emojiU?: string
    wikiDataId?: string
}

type StateCsvRow = {
    id: string
    name: string
    country_id: string
    country_code?: string
    country_name?: string
    iso2?: string
    iso3166_2?: string
    fips_code?: string
    type?: string
    level?: string
    parent_id?: string
    native?: string
    latitude?: string
    longitude?: string
    timezone?: string
    wikiDataId?: string
    population?: string
}

type CityJsonRow = {
    id: number
    name: string
    state_id?: number | null
    state_code?: string | null
    state_name?: string | null
    country_id: number
    country_code?: string | null
    country_name?: string | null
    latitude?: string | null
    longitude?: string | null
    native?: string | null
    type?: string | null
    level?: string | null
    parent_id?: number | null
    population?: number | null
    timezone?: string | null
    translations?: Record<string, string> | null
    wikiDataId?: string | null
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const geoSourceDir = path.join(__dirname, "geo-source")

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run geo seed")
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter, log: ["error"] })

function parseCsvLine(line: string) {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index]
        const next = line[index + 1]

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"'
                index += 1
                continue
            }
            inQuotes = !inQuotes
            continue
        }

        if (char === "," && !inQuotes) {
            values.push(current)
            current = ""
            continue
        }

        current += char
    }

    values.push(current)
    return values
}

async function readCsvRows<T extends Record<string, string | undefined>>(filename: string): Promise<T[]> {
    const filePath = path.join(geoSourceDir, filename)
    const content = await fs.readFile(filePath, "utf8")
    const lines = content.split(/\r?\n/).filter(Boolean)

    const headers = parseCsvLine(lines[0])
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line)
        return headers.reduce<Record<string, string | undefined>>((acc, header, index) => {
            acc[header] = values[index]
            return acc
        }, {}) as T
    })
}

function toInt(value?: string | number | null) {
    if (value === undefined || value === null || value === "") return null
    const parsed = Number.parseInt(String(value), 10)
    return Number.isNaN(parsed) ? null : parsed
}

function toBigInt(value?: string | number | null) {
    if (value === undefined || value === null || value === "") return null
    try {
        return BigInt(String(value))
    } catch {
        return null
    }
}

function toDecimal(value?: string | number | null) {
    if (value === undefined || value === null || value === "") return null
    return String(value)
}

function toJsonObject(value?: string | null) {
    if (!value) return null
    try {
        const normalized = value.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":').replace(/'/g, '"')
        return JSON.parse(normalized)
    } catch {
        return null
    }
}

async function main() {
    const [countries, states, citiesRaw] = await Promise.all([
        readCsvRows<CountryCsvRow>("countries.csv"),
        readCsvRows<StateCsvRow>("states.csv"),
        fs.readFile(path.join(geoSourceDir, "json-cities.json"), "utf8"),
    ])

    const cities = JSON.parse(citiesRaw) as CityJsonRow[]

    await prisma.customerAddress.updateMany({
        data: {
            countryId: null,
            stateId: null,
            cityId: null,
        },
    })

    await prisma.geoCity.deleteMany()
    await prisma.geoState.deleteMany()
    await prisma.geoCountry.deleteMany()

    await prisma.geoCountry.createMany({
        data: countries.map((country) => ({
            id: Number(country.id),
            name: country.name,
            iso3: country.iso3 || null,
            iso2: country.iso2,
            numericCode: country.numeric_code || null,
            phoneCode: country.phonecode || null,
            capital: country.capital || null,
            currency: country.currency || null,
            currencyName: country.currency_name || null,
            currencySymbol: country.currency_symbol || null,
            tld: country.tld || null,
            native: country.native || null,
            population: toBigInt(country.population),
            gdp: country.gdp || null,
            region: country.region || null,
            regionId: toInt(country.region_id),
            subregion: country.subregion || null,
            subregionId: toInt(country.subregion_id),
            nationality: country.nationality || null,
            areaSqKm: country.area_sq_km || null,
            postalCodeFormat: country.postal_code_format || null,
            postalCodeRegex: country.postal_code_regex || null,
            timezones: toJsonObject(country.timezones),
            latitude: toDecimal(country.latitude),
            longitude: toDecimal(country.longitude),
            emoji: country.emoji || null,
            emojiU: country.emojiU || null,
            wikiDataId: country.wikiDataId || null,
        })),
    })

    await prisma.geoState.createMany({
        data: states.map((state) => ({
            id: Number(state.id),
            name: state.name,
            countryId: Number(state.country_id),
            countryCode: state.country_code || null,
            countryName: state.country_name || null,
            iso2: state.iso2 || null,
            iso3166_2: state.iso3166_2 || null,
            fipsCode: state.fips_code || null,
            type: state.type || null,
            level: state.level || null,
            parentId: toInt(state.parent_id),
            native: state.native || null,
            latitude: toDecimal(state.latitude),
            longitude: toDecimal(state.longitude),
            timezone: state.timezone || null,
            wikiDataId: state.wikiDataId || null,
            population: toBigInt(state.population),
        })),
    })

    const batchSize = 2500
    for (let index = 0; index < cities.length; index += batchSize) {
        const batch = cities.slice(index, index + batchSize)
        await prisma.geoCity.createMany({
            data: batch.map((city) => ({
                id: city.id,
                name: city.name,
                stateId: city.state_id ?? null,
                stateCode: city.state_code || null,
                stateName: city.state_name || null,
                countryId: city.country_id,
                countryCode: city.country_code || null,
                countryName: city.country_name || null,
                latitude: toDecimal(city.latitude),
                longitude: toDecimal(city.longitude),
                native: city.native || null,
                type: city.type || null,
                level: city.level || null,
                parentId: toInt(city.parent_id),
                population: toBigInt(city.population),
                timezone: city.timezone || null,
                translations: city.translations ?? Prisma.JsonNull,
                wikiDataId: city.wikiDataId || null,
            })),
        })
    }

    console.log(`Imported ${countries.length} countries, ${states.length} states and ${cities.length} cities.`)
}

main()
    .catch((error) => {
        console.error("Geo seed failed", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
