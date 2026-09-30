import { prisma } from "@/core/db/prisma"
import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import type { MoldOwnership, MoldStatus } from "@/prisma/generated/prisma/client"
import {
    productSizeLabelSelect,
    toProductSizeRef,
    type ProductSizeRefDto,
} from "@/core/helpers/prisma/productionReferences/repository"

const moldSelect = {
    id: true,
    code: true,
    name: true,
    status: true,
    ownership: true,
    ownerCustomerId: true,
    requiredClampForceTon: true,
    widthMm: true,
    heightMm: true,
    thicknessMm: true,
    weightKg: true,
    requiredOpeningStrokeMm: true,
    locatingRingDiameterMm: true,
    hotRunnerZones: true,
    coreCircuitsRequired: true,
    requiresRobot: true,
    standardCycleTimeSec: true,
    runnerWeightG: true,
    expectedScrapPercent: true,
    setupMinutes: true,
    totalShots: true,
    maintenanceIntervalShots: true,
    shotsAtLastMaintenance: true,
    lastMaintenanceAt: true,
    storageLocation: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    outputs: {
        // Göz grubu satırlarında sıra kolonu yok: ürün modeli kodu + ölçü sırası kararlı.
        orderBy: [{ productSize: { product: { code: "asc" } } }, { productSize: { sortKey: "asc" } }],
        select: {
            id: true,
            productSizeId: true,
            cavities: true,
            partWeightG: true,
            productSize: {
                select: {
                    ...productSizeLabelSelect,
                    product: { select: { id: true, code: true, name: true } },
                },
            },
        },
    },
    machineProfiles: {
        orderBy: { machine: { code: "asc" } },
        select: {
            id: true,
            machineId: true,
            cycleTimeSec: true,
            setupMinutes: true,
            isPreferred: true,
            isBlocked: true,
            notes: true,
            machine: { select: { id: true, code: true, name: true } },
        },
    },
} satisfies Prisma.MoldSelect

type MoldRecord = Prisma.MoldGetPayload<{ select: typeof moldSelect }>

export type MoldOutputDto = {
    id: string
    productSizeId: string
    cavities: number
    partWeightG: number | null
    product: { id: string; code: string; name: string }
    size: ProductSizeRefDto
}

export type MoldDto = Omit<MoldRecord, "outputs"> & {
    outputs: MoldOutputDto[]
}

export type MoldWriteInput = {
    code: string
    name: string
    status: MoldStatus
    ownership: MoldOwnership
    ownerCustomerId: string | null
    requiredClampForceTon: number | null
    widthMm: number | null
    heightMm: number | null
    thicknessMm: number | null
    weightKg: number | null
    requiredOpeningStrokeMm: number | null
    locatingRingDiameterMm: number | null
    hotRunnerZones: number
    coreCircuitsRequired: number
    requiresRobot: boolean
    standardCycleTimeSec: number
    runnerWeightG: number | null
    expectedScrapPercent: number
    setupMinutes: number
    totalShots: number
    maintenanceIntervalShots: number | null
    shotsAtLastMaintenance: number
    lastMaintenanceAt: Date | null
    storageLocation: string | null
    notes: string | null
}

export type MoldOutputWriteInput = {
    productSizeId: string
    cavities: number
    partWeightG: number | null
}

export type MoldMachineProfileWriteInput = {
    machineId: string
    cycleTimeSec: number | null
    setupMinutes: number | null
    isPreferred: boolean
    isBlocked: boolean
    notes: string | null
}

function toMoldDto({ outputs, ...record }: MoldRecord): MoldDto {
    return {
        ...record,
        outputs: outputs.map(({ productSize, ...output }) => ({
            ...output,
            product: productSize.product,
            size: toProductSizeRef(productSize.product.code, productSize),
        })),
    }
}

export interface IPrismaProductionMoldRepository {
    listMolds(): Promise<MoldDto[]>
    getMold(id: string): Promise<MoldDto | null>
    createMold(
        input: MoldWriteInput,
        outputs: MoldOutputWriteInput[],
        machineProfiles: MoldMachineProfileWriteInput[],
    ): Promise<MoldDto>
    /**
     * `machineProfiles` verilirse TAM değişim. `outputs` verilirse listeye EŞİTLENİR ama fark
     * tabanlı: kalan ölçünün satırı korunur (işler ona `Restrict` ile bağlı), çıkarılan silinir,
     * yeni eklenir. `undefined` → dokunulmaz.
     */
    updateMold(
        id: string,
        input: Partial<MoldWriteInput>,
        outputs?: MoldOutputWriteInput[],
        machineProfiles?: MoldMachineProfileWriteInput[],
    ): Promise<MoldDto>
    deleteMold(id: string): Promise<void>
    /** Kalıbı kullanan iş sayısı (silme koruması). */
    countJobs(moldId: string): Promise<number>
    /**
     * "Bakım yapıldı": son bakım sayacı = güncel sayaç, bakım anı. Sayaç arada rapordan artarsa
     * (yarış) güncel değeri okuyup yeniden dener. Kalıp yoksa `null`.
     */
    recordMaintenance(id: string, performedAt: Date): Promise<MoldDto | null>
    /** `keepProductSizeIds` dışında kalacak (silinecek) gözlere bağlı iş çıktısı sayısı. */
    countJobOutputsOnRemovedOutputs(moldId: string, keepProductSizeIds: string[]): Promise<number>
    /**
     * Gerçekleşen çevrim önerisini makine kartına yazar (5.3): kart varsa yalnız çevrimi değişir,
     * yoksa bu çevrimle oluşturulur (tercih / engel işaretsiz). Kalıp yoksa `null`.
     */
    setMachineProfileCycle(moldId: string, machineId: string, cycleTimeSec: number): Promise<{ created: boolean } | null>
}

export const productionMoldRepository = (): IPrismaProductionMoldRepository => {
    const listMolds = async () => {
        const records = await prisma.mold.findMany({ orderBy: { code: "asc" }, select: moldSelect })
        return records.map(toMoldDto)
    }

    const getMold = async (id: string) => {
        const record = await prisma.mold.findUnique({ where: { id }, select: moldSelect })
        return record ? toMoldDto(record) : null
    }

    // İç içe yazma tek Prisma çağrısında — Prisma bunu kendi transaction'ında yürütür;
    // interaktif transaction ve ek gidiş-dönüş yok (Neon P2028 dersi).
    const createMold = async (
        input: MoldWriteInput,
        outputs: MoldOutputWriteInput[],
        machineProfiles: MoldMachineProfileWriteInput[],
    ) => {
        const record = await prisma.mold.create({
            data: {
                ...input,
                outputs: { createMany: { data: outputs } },
                machineProfiles: { createMany: { data: machineProfiles } },
            },
            select: moldSelect,
        })
        return toMoldDto(record)
    }

    const updateMold = async (
        id: string,
        input: Partial<MoldWriteInput>,
        outputs?: MoldOutputWriteInput[],
        machineProfiles?: MoldMachineProfileWriteInput[],
    ) => {
        const record = await prisma.mold.update({
            where: { id },
            data: {
                ...input,
                ...(outputs
                    ? {
                        outputs: {
                            deleteMany: { productSizeId: { notIn: outputs.map((output) => output.productSizeId) } },
                            upsert: outputs.map((output) => ({
                                where: { moldId_productSizeId: { moldId: id, productSizeId: output.productSizeId } },
                                create: output,
                                update: { cavities: output.cavities, partWeightG: output.partWeightG },
                            })),
                        },
                    }
                    : {}),
                ...(machineProfiles
                    ? { machineProfiles: { deleteMany: {}, createMany: { data: machineProfiles } } }
                    : {}),
            },
            select: moldSelect,
        })
        return toMoldDto(record)
    }

    const deleteMold = async (id: string) => {
        await prisma.mold.delete({ where: { id } })
    }

    const countJobs = async (moldId: string) => prisma.productionJob.count({ where: { moldId } })

    const setMachineProfileCycle = async (moldId: string, machineId: string, cycleTimeSec: number) => {
        const mold = await prisma.mold.findUnique({
            where: { id: moldId },
            select: { machineProfiles: { where: { machineId }, select: { id: true } } },
        })
        if (!mold) return null
        await prisma.moldMachineProfile.upsert({
            where: { moldId_machineId: { moldId, machineId } },
            create: { moldId, machineId, cycleTimeSec },
            update: { cycleTimeSec },
            select: { id: true },
        })
        return { created: mold.machineProfiles.length === 0 }
    }

    const countJobOutputsOnRemovedOutputs = async (moldId: string, keepProductSizeIds: string[]) => {
        return prisma.productionJobOutput.count({
            where: { moldOutput: { moldId, productSizeId: { notIn: keepProductSizeIds } } },
        })
    }

    const recordMaintenance = async (id: string, performedAt: Date) => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const current = await prisma.mold.findUnique({ where: { id }, select: { totalShots: true } })
            if (!current) return null
            try {
                const record = await prisma.mold.update({
                    where: { id, totalShots: current.totalShots },
                    data: { shotsAtLastMaintenance: current.totalShots, lastMaintenanceAt: performedAt },
                    select: moldSelect,
                })
                return toMoldDto(record)
            } catch (error) {
                if (!isPrismaErrorCode(error, "P2025")) throw error
            }
        }
        throw new Error("Kalıp sayacı değişiyor; birazdan tekrar deneyin.")
    }

    return {
        listMolds,
        getMold,
        createMold,
        updateMold,
        deleteMold,
        countJobs,
        countJobOutputsOnRemovedOutputs,
        recordMaintenance,
        setMachineProfileCycle,
    }
}
