import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    measurementType: {
        findMany: vi.fn(),
        count: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { measurementTypeRepository } from "./repository"

/**
 * `code` bir ENUM kolonu: Prisma enum'da `contains` yok. Eskiden arama `code`'u
 * `contains` ile sorguluyordu ve ölçü tipleri sayfasında herhangi bir arama
 * PrismaClientValidationError → 500 ile düşüyordu.
 */
describe("listMeasurementTypes — arama", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        prismaMock.measurementType.findMany.mockResolvedValue([])
        prismaMock.measurementType.count.mockResolvedValue(0)
    })

    const whereOf = () => prismaMock.measurementType.findMany.mock.calls[0][0].where

    it("kodu `contains` ile değil, eşleşen kodların listesiyle (`in`) arar", async () => {
        await measurementTypeRepository().listMeasurementTypes({ search: "r-l", page: 1, limit: 20 })

        const where = whereOf()
        expect(where.OR).toEqual([
            { name: { contains: "r-l", mode: "insensitive" } },
            { baseUnit: { contains: "r-l", mode: "insensitive" } },
            { code: { in: ["R_L"] } },
        ])
        expect(prismaMock.measurementType.count).toHaveBeenCalledWith({ where })
    })

    it("hiçbir kodla eşleşmeyen arama yalnız ad ve birimde arar", async () => {
        await measurementTypeRepository().listMeasurementTypes({ search: "Çap", page: 1, limit: 20 })

        expect(whereOf().OR).toEqual([
            { name: { contains: "Çap", mode: "insensitive" } },
            { baseUnit: { contains: "Çap", mode: "insensitive" } },
        ])
    })

    it("kod filtresi (açılır liste) birebir eşitlikle kalır", async () => {
        await measurementTypeRepository().listMeasurementTypes({ code: "P_T", page: 1, limit: 20 })

        expect(whereOf()).toEqual({ code: "P_T" })
    })
})
