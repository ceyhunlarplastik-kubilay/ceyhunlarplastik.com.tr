import createError from "http-errors"

import type {
    MoldMachineProfileWriteInput,
    MoldOutputWriteInput,
    MoldWriteInput,
} from "@/core/helpers/prisma/productionMolds/repository"
import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import {
    findMoldMachineProfileIssues,
    findMoldOutputIssues,
    findMoldSpecIssues,
} from "@/core/helpers/production/molds"
import { dateKeyToUtcDate } from "@/core/helpers/production/productionCalendar"
import { normalizeProductionCode } from "@/core/helpers/production/productionMasterData"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, requireText, withoutUndefined } from "@/functions/shared/production/input"
import type {
    ICreateMoldEvent,
    IDeleteMoldEvent,
    IGetMoldEvent,
    IListMoldsEvent,
    IMoldBody,
    IMoldMachineProfileBody,
    IMoldOutputBody,
    IProductionMoldDependencies,
    IRecordMoldMaintenanceEvent,
    ISetMoldMachineCycleEvent,
    IUpdateMoldEvent,
} from "@/functions/ProtectedApi/types/productionMolds"

// Varsayılanlar şemada değil burada (ajv union altındaki default'u uygulayamıyor).
const MOLD_DEFAULTS: Omit<MoldWriteInput, "code" | "name" | "standardCycleTimeSec"> = {
    status: "ACTIVE",
    ownership: "COMPANY",
    ownerCustomerId: null,
    requiredClampForceTon: null,
    widthMm: null,
    heightMm: null,
    thicknessMm: null,
    weightKg: null,
    requiredOpeningStrokeMm: null,
    locatingRingDiameterMm: null,
    hotRunnerZones: 0,
    coreCircuitsRequired: 0,
    requiresRobot: false,
    runnerWeightG: null,
    expectedScrapPercent: 0,
    setupMinutes: 60,
    totalShots: 0,
    maintenanceIntervalShots: null,
    shotsAtLastMaintenance: 0,
    lastMaintenanceAt: null,
    storageLocation: null,
    notes: null,
}

function dateOrNull(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined
    return value ? new Date(value) : null
}

/** Gönderilen alanları yazma biçimine çevirir; gönderilmeyenler `undefined` kalır. */
function mapMoldBody(body: Partial<IMoldBody>): Partial<MoldWriteInput> {
    return withoutUndefined({
        code: body.code === undefined ? undefined : normalizeProductionCode(requireText(body.code, "Kod")),
        name: body.name === undefined ? undefined : requireText(body.name, "Ad"),
        status: body.status,
        ownership: body.ownership,
        // Şirket kalıbının sahibi olmaz; müşteri seçimi arayüze sonra eklenecek.
        ownerCustomerId: body.ownership === "COMPANY" ? null : undefined,
        requiredClampForceTon: body.requiredClampForceTon,
        widthMm: body.widthMm,
        heightMm: body.heightMm,
        thicknessMm: body.thicknessMm,
        weightKg: body.weightKg,
        requiredOpeningStrokeMm: body.requiredOpeningStrokeMm,
        locatingRingDiameterMm: body.locatingRingDiameterMm,
        hotRunnerZones: body.hotRunnerZones,
        coreCircuitsRequired: body.coreCircuitsRequired,
        requiresRobot: body.requiresRobot,
        standardCycleTimeSec: body.standardCycleTimeSec,
        runnerWeightG: body.runnerWeightG,
        expectedScrapPercent: body.expectedScrapPercent,
        setupMinutes: body.setupMinutes,
        totalShots: body.totalShots,
        maintenanceIntervalShots: body.maintenanceIntervalShots,
        shotsAtLastMaintenance: body.shotsAtLastMaintenance,
        lastMaintenanceAt: dateOrNull(body.lastMaintenanceAt),
        storageLocation: optionalText(body.storageLocation),
        notes: optionalText(body.notes),
    })
}

function mapOutputs(outputs: IMoldOutputBody[]): MoldOutputWriteInput[] {
    return outputs.map((output) => ({
        productSizeId: output.productSizeId,
        cavities: output.cavities,
        partWeightG: output.partWeightG ?? null,
    }))
}

function mapMachineProfiles(profiles: IMoldMachineProfileBody[]): MoldMachineProfileWriteInput[] {
    return profiles.map((profile) => ({
        machineId: profile.machineId,
        cycleTimeSec: profile.cycleTimeSec ?? null,
        setupMinutes: profile.setupMinutes ?? null,
        isPreferred: profile.isPreferred ?? false,
        isBlocked: profile.isBlocked ?? false,
        notes: optionalText(profile.notes) ?? null,
    }))
}

function badRequestOnIssues(issues: string[]) {
    if (issues.length > 0) throw new createError.BadRequest(issues.join(" "))
}

/**
 * Göz grubu ve makine kartı kuralları (core `molds.ts`, form da aynısını kullanıyor) +
 * referansların varlığı. Doğrulanmasa geçersiz kimlik FK ihlali olarak 500'e dönerdi.
 */
async function assertChildren(
    deps: IProductionMoldDependencies,
    outputs?: MoldOutputWriteInput[],
    machineProfiles?: MoldMachineProfileWriteInput[],
) {
    if (outputs) {
        badRequestOnIssues(findMoldOutputIssues(outputs))
        const sizeIds = Array.from(new Set(outputs.map((output) => output.productSizeId)))
        const existing = await deps.productionReferenceRepository.findExistingProductSizeIds(sizeIds)
        if (sizeIds.some((id) => !existing.has(id))) {
            throw new createError.NotFound("Seçilen ölçülerden biri bulunamadı; sayfayı yenileyip tekrar seçin.")
        }
        const assignable = await deps.productionReferenceRepository.findMoldAssignableProductSizeIds(sizeIds)
        if (sizeIds.some((id) => !assignable.has(id))) {
            throw new createError.BadRequest(
                "Seçilen ölçülerden biri iç üretim tedarikçisine bağlı değil; kalıba yalnız kendi ürettiğimiz ölçüler bağlanabilir.",
            )
        }
    }

    if (machineProfiles) {
        badRequestOnIssues(findMoldMachineProfileIssues(machineProfiles))
        const machineIds = Array.from(new Set(machineProfiles.map((profile) => profile.machineId)))
        const existing = await deps.productionMachineRepository.findExistingMachineIds(machineIds)
        if (machineIds.some((id) => !existing.has(id))) {
            throw new createError.NotFound("Seçilen makinelerden biri bulunamadı.")
        }
    }
}

function conflictOnDuplicateCode(error: unknown, code: string): never {
    if (isPrismaErrorCode(error, "P2002")) {
        throw new createError.Conflict(`"${code}" koduyla bir kalıp zaten var.`)
    }
    throw error
}

export const listMoldsHandler = ({ productionMoldRepository }: IProductionMoldDependencies) => {
    return async (_event: IListMoldsEvent) => {
        const molds = await productionMoldRepository.listMolds()
        return apiResponseDTO({ statusCode: 200, payload: { molds } })
    }
}

export const getMoldHandler = ({ productionMoldRepository }: IProductionMoldDependencies) => {
    return async (event: IGetMoldEvent) => {
        const mold = await productionMoldRepository.getMold(event.pathParameters.id)
        if (!mold) throw new createError.NotFound("Kalıp bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: { mold } })
    }
}

export const createMoldHandler = (deps: IProductionMoldDependencies) => {
    return async (event: ICreateMoldEvent) => {
        const body = event.body
        const input: MoldWriteInput = {
            ...MOLD_DEFAULTS,
            ...mapMoldBody(body),
            code: normalizeProductionCode(requireText(body.code, "Kod")),
            name: requireText(body.name, "Ad"),
            standardCycleTimeSec: body.standardCycleTimeSec,
        }
        badRequestOnIssues(findMoldSpecIssues(input))

        const outputs = mapOutputs(body.outputs ?? [])
        const machineProfiles = mapMachineProfiles(body.machineProfiles ?? [])
        await assertChildren(deps, outputs, machineProfiles)

        try {
            const mold = await deps.productionMoldRepository.createMold(input, outputs, machineProfiles)
            return apiResponseDTO({ statusCode: 201, payload: { mold } })
        } catch (error) {
            conflictOnDuplicateCode(error, input.code)
        }
    }
}

export const updateMoldHandler = (deps: IProductionMoldDependencies) => {
    return async (event: IUpdateMoldEvent) => {
        const { id } = event.pathParameters
        const body = event.body
        const existing = await deps.productionMoldRepository.getMold(id)
        if (!existing) throw new createError.NotFound("Kalıp bulunamadı.")

        const input = mapMoldBody(body)
        // Kısmi güncelleme: sayaç kuralı gönderilen ile kayıttaki değerin birleşimine uygulanır.
        badRequestOnIssues(findMoldSpecIssues({
            totalShots: input.totalShots ?? existing.totalShots,
            shotsAtLastMaintenance: input.shotsAtLastMaintenance ?? existing.shotsAtLastMaintenance,
        }))

        // Gönderilmeyen liste → mevcut satırlara dokunulmaz; gönderilen → listeye eşitlenir
        // (göz grupları fark tabanlı: kalan ölçünün satırı korunur, işler ona bağlı).
        const outputs = body.outputs ? mapOutputs(body.outputs) : undefined
        const machineProfiles = body.machineProfiles ? mapMachineProfiles(body.machineProfiles) : undefined
        await assertChildren(deps, outputs, machineProfiles)

        if (outputs) {
            const referenced = await deps.productionMoldRepository.countJobOutputsOnRemovedOutputs(
                id,
                outputs.map((output) => output.productSizeId),
            )
            if (referenced > 0) {
                throw new createError.Conflict(
                    "Çıkarılan göz grubu üretim işlerinde kullanılıyor; önce o işleri iptal edin ya da göz sayısını 0 yapmak yerine grubu koruyun.",
                )
            }
        }

        try {
            const mold = await deps.productionMoldRepository.updateMold(id, input, outputs, machineProfiles)
            return apiResponseDTO({ statusCode: 200, payload: { mold } })
        } catch (error) {
            conflictOnDuplicateCode(error, input.code ?? existing.code)
        }
    }
}

export const deleteMoldHandler = ({ productionMoldRepository }: IProductionMoldDependencies) => {
    return async (event: IDeleteMoldEvent) => {
        const { id } = event.pathParameters
        const existing = await productionMoldRepository.getMold(id)
        if (!existing) throw new createError.NotFound("Kalıp bulunamadı.")

        // Göz grupları ve makine kartları Cascade ile gider; işler kalıba `Restrict` ile bağlı.
        const jobCount = await productionMoldRepository.countJobs(id)
        if (jobCount > 0) {
            throw new createError.Conflict(
                `${existing.code} ${jobCount} üretim işinde kullanılıyor; silmek yerine durumunu "Kullanım dışı" yapın.`,
            )
        }
        await productionMoldRepository.deleteMold(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}

/** Bakım anı "şimdi"den en çok bu kadar ileride olabilir (saat farkı toleransı). */
const MAINTENANCE_FUTURE_TOLERANCE_MS = 5 * 60_000

/**
 * "Bakım yapıldı": son bakım sayacı güncel sayaca eşitlenir, bakım GÜNÜ yazılır. Bakım aralığı ve
 * sayaç kalıp formundan da düzeltilebilir; bu uç tek tıklık kısayol (4.3). Tarih formla aynı
 * sözleşmede saklanır (fabrika günü, UTC gece yarısı) — form tarihi `slice(0, 10)` ile okuyup geri
 * yazdığı için tam an saklansa gece yarısına yakın bakım bir sonraki form kaydında gün kayardı.
 */
export const recordMoldMaintenanceHandler = ({ productionMoldRepository }: IProductionMoldDependencies) => {
    return async (event: IRecordMoldMaintenanceEvent) => {
        const now = new Date()
        const performedAt = event.body?.performedAt ? new Date(event.body.performedAt) : now
        if (performedAt.getTime() > now.getTime() + MAINTENANCE_FUTURE_TOLERANCE_MS) {
            throw new createError.BadRequest("Bakım anı gelecekte olamaz.")
        }
        const mold = await productionMoldRepository.recordMaintenance(event.pathParameters.id, dateKeyToUtcDate(productionDateKey(performedAt)))
        if (!mold) throw new createError.NotFound("Kalıp bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: { mold } })
    }
}

/**
 * Gerçekleşen çevrim önerisini makine kartına yazar (5.3). Kart yoksa bu çevrimle oluşur; tercih /
 * engel işaretlerine dokunulmaz. Sonraki planlar kart çevrimini kullanır (çevrim zinciri 2. adım).
 */
export const setMoldMachineCycleHandler = ({ productionMoldRepository, productionMachineRepository }: IProductionMoldDependencies) => {
    return async (event: ISetMoldMachineCycleEvent) => {
        const { id, machineId } = event.pathParameters
        const cycleTimeSec = event.body.cycleTimeSec
        const machines = await productionMachineRepository.findExistingMachineIds([machineId])
        if (!machines.has(machineId)) throw new createError.BadRequest("Makine bulunamadı.")
        const result = await productionMoldRepository.setMachineProfileCycle(id, machineId, cycleTimeSec)
        if (!result) throw new createError.NotFound("Kalıp bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: { moldId: id, machineId, cycleTimeSec, created: result.created } })
    }
}
