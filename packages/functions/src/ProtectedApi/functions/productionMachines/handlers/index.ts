import createError from "http-errors"

import type { ProductionMachineWriteInput } from "@/core/helpers/prisma/productionMachines/repository"
import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import { findMachineSpecIssues, normalizeProductionCode } from "@/core/helpers/production/productionMasterData"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, requireText, withoutUndefined } from "@/functions/shared/production/input"
import type {
    ICreateProductionMachineEvent,
    IDeleteProductionMachineEvent,
    IGetProductionMachineEvent,
    IListProductionMachinesEvent,
    IProductionMachineBody,
    IProductionMachineDependencies,
    IUpdateProductionMachineEvent,
} from "@/functions/ProtectedApi/types/productionMachines"

/** Gönderilen alanları yazma biçimine çevirir; gönderilmeyenler `undefined` kalır. */
function mapMachineBody(body: Partial<IProductionMachineBody>): Partial<ProductionMachineWriteInput> {
    return withoutUndefined({
        code: body.code === undefined ? undefined : normalizeProductionCode(requireText(body.code, "Kod")),
        name: body.name === undefined ? undefined : requireText(body.name, "Ad"),
        brand: optionalText(body.brand),
        model: optionalText(body.model),
        serialNumber: optionalText(body.serialNumber),
        manufactureYear: body.manufactureYear,
        areaId: body.areaId,
        status: body.status,
        clampForceTon: body.clampForceTon,
        tieBarHorizontalMm: body.tieBarHorizontalMm,
        tieBarVerticalMm: body.tieBarVerticalMm,
        minMoldHeightMm: body.minMoldHeightMm,
        maxMoldHeightMm: body.maxMoldHeightMm,
        maxOpeningStrokeMm: body.maxOpeningStrokeMm,
        maxDaylightMm: body.maxDaylightMm,
        shotCapacityG: body.shotCapacityG,
        screwDiameterMm: body.screwDiameterMm,
        locatingRingDiameterMm: body.locatingRingDiameterMm,
        hotRunnerZones: body.hotRunnerZones,
        coreCircuits: body.coreCircuits,
        hasRobot: body.hasRobot,
        plannedEfficiencyPercent: body.plannedEfficiencyPercent,
        hourlyCost: body.hourlyCost,
        shiftPatternId: body.shiftPatternId,
        sortOrder: body.sortOrder,
        notes: optionalText(body.notes),
    })
}

function assertSpecs(spec: Parameters<typeof findMachineSpecIssues>[0]) {
    const issues = findMachineSpecIssues(spec)
    if (issues.length > 0) throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))
}

async function assertReferences(
    deps: IProductionMachineDependencies,
    refs: { areaId?: string; shiftPatternId?: string | null },
) {
    if (refs.areaId && !(await deps.productionAreaRepository.getArea(refs.areaId))) {
        throw new createError.NotFound("Alan bulunamadı.")
    }
    if (refs.shiftPatternId && !(await deps.productionShiftPatternRepository.getShiftPattern(refs.shiftPatternId))) {
        throw new createError.NotFound("Vardiya düzeni bulunamadı.")
    }
}

function conflictOnDuplicateCode(error: unknown, code: string): never {
    if (isPrismaErrorCode(error, "P2002")) {
        throw new createError.Conflict(`"${code}" koduyla bir makine zaten var.`)
    }
    throw error
}

export const listProductionMachinesHandler = ({ productionMachineRepository }: IProductionMachineDependencies) => {
    return async (_event: IListProductionMachinesEvent) => {
        const machines = await productionMachineRepository.listMachines()
        return apiResponseDTO({ statusCode: 200, payload: { machines } })
    }
}

export const getProductionMachineHandler = ({ productionMachineRepository }: IProductionMachineDependencies) => {
    return async (event: IGetProductionMachineEvent) => {
        const machine = await productionMachineRepository.getMachine(event.pathParameters.id)
        if (!machine) throw new createError.NotFound("Makine bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: { machine } })
    }
}

// Varsayılanlar şemada değil burada (ajv union altındaki default'u uygulayamıyor).
const MACHINE_DEFAULTS: Omit<ProductionMachineWriteInput, "code" | "name" | "areaId" | "clampForceTon"> = {
    brand: null,
    model: null,
    serialNumber: null,
    manufactureYear: null,
    status: "ACTIVE",
    tieBarHorizontalMm: null,
    tieBarVerticalMm: null,
    minMoldHeightMm: null,
    maxMoldHeightMm: null,
    maxOpeningStrokeMm: null,
    maxDaylightMm: null,
    shotCapacityG: null,
    screwDiameterMm: null,
    locatingRingDiameterMm: null,
    hotRunnerZones: 0,
    coreCircuits: 0,
    hasRobot: false,
    plannedEfficiencyPercent: 85,
    hourlyCost: null,
    shiftPatternId: null,
    sortOrder: 0,
    notes: null,
}

export const createProductionMachineHandler = (deps: IProductionMachineDependencies) => {
    return async (event: ICreateProductionMachineEvent) => {
        const body = event.body
        const input: ProductionMachineWriteInput = {
            ...MACHINE_DEFAULTS,
            ...mapMachineBody(body),
            code: normalizeProductionCode(requireText(body.code, "Kod")),
            name: requireText(body.name, "Ad"),
            areaId: body.areaId,
            clampForceTon: body.clampForceTon,
        }

        assertSpecs(input)
        await assertReferences(deps, { areaId: input.areaId, shiftPatternId: input.shiftPatternId })

        try {
            const machine = await deps.productionMachineRepository.createMachine(input)
            return apiResponseDTO({ statusCode: 201, payload: { machine } })
        } catch (error) {
            conflictOnDuplicateCode(error, input.code)
        }
    }
}

export const updateProductionMachineHandler = (deps: IProductionMachineDependencies) => {
    return async (event: IUpdateProductionMachineEvent) => {
        const { id } = event.pathParameters
        const existing = await deps.productionMachineRepository.getMachine(id)
        if (!existing) throw new createError.NotFound("Makine bulunamadı.")

        const input = mapMachineBody(event.body)

        // Kısmi güncelleme: kural gönderilen değer ile kayıttaki değerin BİRLEŞİMİNE uygulanır
        // (yalnız minimum gönderilse bile mevcut maksimumla karşılaştırılmalı).
        assertSpecs({
            minMoldHeightMm: "minMoldHeightMm" in input ? input.minMoldHeightMm : existing.minMoldHeightMm,
            maxMoldHeightMm: "maxMoldHeightMm" in input ? input.maxMoldHeightMm : existing.maxMoldHeightMm,
            maxOpeningStrokeMm: "maxOpeningStrokeMm" in input ? input.maxOpeningStrokeMm : existing.maxOpeningStrokeMm,
            maxDaylightMm: "maxDaylightMm" in input ? input.maxDaylightMm : existing.maxDaylightMm,
        })
        await assertReferences(deps, { areaId: input.areaId, shiftPatternId: input.shiftPatternId })

        try {
            const machine = await deps.productionMachineRepository.updateMachine(id, input)
            return apiResponseDTO({ statusCode: 200, payload: { machine } })
        } catch (error) {
            conflictOnDuplicateCode(error, input.code ?? existing.code)
        }
    }
}

export const deleteProductionMachineHandler = ({ productionMachineRepository }: IProductionMachineDependencies) => {
    return async (event: IDeleteProductionMachineEvent) => {
        const { id } = event.pathParameters
        const existing = await productionMachineRepository.getMachine(id)
        if (!existing) throw new createError.NotFound("Makine bulunamadı.")

        // Bağlı kalıp kartları, duruşlar ve takvim istisnaları Cascade ile gider; işler makineye
        // `Restrict` ile bağlı — FK hatası 500'e düşmesin diye önce sayılır.
        const jobCount = await productionMachineRepository.countJobs(id)
        if (jobCount > 0) {
            throw new createError.Conflict(
                `${existing.code} makinesine ${jobCount} üretim işi planlı; silmek yerine durumunu "Kullanım dışı" yapın.`,
            )
        }
        await productionMachineRepository.deleteMachine(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}
