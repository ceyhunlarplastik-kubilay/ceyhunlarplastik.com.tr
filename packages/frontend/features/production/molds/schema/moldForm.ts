import { z } from "zod"

import {
    findMoldMachineProfileIssues,
    findMoldOutputIssues,
    findMoldSpecIssues,
    MAX_MOLD_OUTPUTS,
} from "@core/helpers/production/molds"
import type { Mold, MoldInput } from "@/features/production/molds/api/types"
import {
    optionalDecimalField,
    optionalIntegerField,
    requiredDecimalField,
    requiredIntegerField,
    toFieldText,
} from "@/features/production/shared/formNumbers"

const MILLIMETERS = { min: 1, max: 20000 }
const SHOT_COUNT = { min: 0, max: 2_000_000_000 }

/** `productId` yalnız arayüz içindir (ölçü seçicisini ürün modeline göre doldurur). */
export const moldOutputRowSchema = z.object({
    productId: z.string(),
    productSizeId: z.string().min(1, "Ölçü seçin"),
    cavities: requiredIntegerField("Göz sayısı", { min: 1, max: 256 }),
    partWeightG: optionalDecimalField("Parça ağırlığı", { min: 0.01, max: 100_000 }),
})

export const moldMachineProfileRowSchema = z.object({
    machineId: z.string().min(1, "Makine seçin"),
    cycleTimeSec: optionalDecimalField("Çevrim", { min: 0.1, max: 3600 }),
    setupMinutes: optionalIntegerField("Bağlama süresi", { min: 0, max: 10_000 }),
    isPreferred: z.boolean(),
    isBlocked: z.boolean(),
    notes: z.string().trim().max(1000, "En fazla 1000 karakter"),
})

/**
 * Kalıp formu. Göz grubu / makine kartı / sayaç kuralları sunucudakiyle AYNI
 * fonksiyonlar (core `molds.ts`).
 */
export const moldFormSchema = z.object({
    code: z.string().trim().min(1, "Kod zorunlu").max(30, "En fazla 30 karakter"),
    name: z.string().trim().min(1, "Ad zorunlu").max(160, "En fazla 160 karakter"),
    status: z.enum(["ACTIVE", "IN_MAINTENANCE", "BROKEN", "RETIRED"]),
    ownership: z.enum(["COMPANY", "CUSTOMER"]),
    requiredClampForceTon: optionalIntegerField("Gerekli tonaj", { min: 1, max: 10_000 }),
    widthMm: optionalIntegerField("Genişlik", MILLIMETERS),
    heightMm: optionalIntegerField("Yükseklik", MILLIMETERS),
    thicknessMm: optionalIntegerField("Kalınlık", MILLIMETERS),
    weightKg: optionalDecimalField("Ağırlık", { min: 0.01, max: 100_000 }),
    requiredOpeningStrokeMm: optionalIntegerField("Gerekli açılma", MILLIMETERS),
    locatingRingDiameterMm: optionalIntegerField("Merkezleme bileziği", { min: 1, max: 1000 }),
    hotRunnerZones: requiredIntegerField("Sıcak yolluk bölgesi", { min: 0, max: 200 }),
    coreCircuitsRequired: requiredIntegerField("Maça devresi", { min: 0, max: 50 }),
    requiresRobot: z.boolean(),
    standardCycleTimeSec: requiredDecimalField("Çevrim süresi", { min: 0.1, max: 3600 }),
    runnerWeightG: optionalDecimalField("Yolluk ağırlığı", { min: 0, max: 100_000 }),
    expectedScrapPercent: requiredDecimalField("Beklenen fire", { min: 0, max: 100 }),
    setupMinutes: requiredIntegerField("Bağlama süresi", { min: 0, max: 10_000 }),
    totalShots: requiredIntegerField("Toplam baskı", SHOT_COUNT),
    maintenanceIntervalShots: optionalIntegerField("Bakım aralığı", { min: 1, max: 2_000_000_000 }),
    shotsAtLastMaintenance: requiredIntegerField("Son bakımdaki baskı", SHOT_COUNT),
    /** `<input type="date">`: "YYYY-MM-DD" ya da boş. */
    lastMaintenanceAt: z.string(),
    storageLocation: z.string().trim().max(120, "En fazla 120 karakter"),
    notes: z.string().trim().max(5000, "En fazla 5000 karakter"),
    outputs: z.array(moldOutputRowSchema).max(MAX_MOLD_OUTPUTS),
    machineProfiles: z.array(moldMachineProfileRowSchema).max(100),
}).superRefine((values, ctx) => {
    for (const message of findMoldOutputIssues(values.outputs)) {
        ctx.addIssue({ code: "custom", path: ["outputs"], message })
    }
    for (const message of findMoldMachineProfileIssues(values.machineProfiles)) {
        ctx.addIssue({ code: "custom", path: ["machineProfiles"], message })
    }
    for (const message of findMoldSpecIssues(values)) {
        ctx.addIssue({ code: "custom", path: ["shotsAtLastMaintenance"], message })
    }
})

export type MoldFormInput = z.input<typeof moldFormSchema>
export type MoldFormValues = z.output<typeof moldFormSchema>
export type MoldOutputRowInput = z.input<typeof moldOutputRowSchema>
export type MoldMachineProfileRowInput = z.input<typeof moldMachineProfileRowSchema>

export function emptyMoldOutputRow(): MoldOutputRowInput {
    return { productId: "", productSizeId: "", cavities: "1", partWeightG: "" }
}

export function emptyMoldMachineProfileRow(): MoldMachineProfileRowInput {
    return { machineId: "", cycleTimeSec: "", setupMinutes: "", isPreferred: false, isBlocked: false, notes: "" }
}

export function createMoldFormDefaults(mold?: Mold | null): MoldFormInput {
    return {
        code: mold?.code ?? "",
        name: mold?.name ?? "",
        status: mold?.status ?? "ACTIVE",
        ownership: mold?.ownership ?? "COMPANY",
        requiredClampForceTon: toFieldText(mold?.requiredClampForceTon),
        widthMm: toFieldText(mold?.widthMm),
        heightMm: toFieldText(mold?.heightMm),
        thicknessMm: toFieldText(mold?.thicknessMm),
        weightKg: toFieldText(mold?.weightKg),
        requiredOpeningStrokeMm: toFieldText(mold?.requiredOpeningStrokeMm),
        locatingRingDiameterMm: toFieldText(mold?.locatingRingDiameterMm),
        hotRunnerZones: toFieldText(mold?.hotRunnerZones ?? 0),
        coreCircuitsRequired: toFieldText(mold?.coreCircuitsRequired ?? 0),
        requiresRobot: mold?.requiresRobot ?? false,
        standardCycleTimeSec: toFieldText(mold?.standardCycleTimeSec),
        runnerWeightG: toFieldText(mold?.runnerWeightG),
        expectedScrapPercent: toFieldText(mold?.expectedScrapPercent ?? 0),
        setupMinutes: toFieldText(mold?.setupMinutes ?? 60),
        totalShots: toFieldText(mold?.totalShots ?? 0),
        maintenanceIntervalShots: toFieldText(mold?.maintenanceIntervalShots),
        shotsAtLastMaintenance: toFieldText(mold?.shotsAtLastMaintenance ?? 0),
        lastMaintenanceAt: mold?.lastMaintenanceAt ? mold.lastMaintenanceAt.slice(0, 10) : "",
        storageLocation: mold?.storageLocation ?? "",
        notes: mold?.notes ?? "",
        outputs: (mold?.outputs ?? []).map((output) => ({
            productId: output.product.id,
            productSizeId: output.productSizeId,
            cavities: toFieldText(output.cavities),
            partWeightG: toFieldText(output.partWeightG),
        })),
        machineProfiles: (mold?.machineProfiles ?? []).map((profile) => ({
            machineId: profile.machineId,
            cycleTimeSec: toFieldText(profile.cycleTimeSec),
            setupMinutes: toFieldText(profile.setupMinutes),
            isPreferred: profile.isPreferred,
            isBlocked: profile.isBlocked,
            notes: profile.notes ?? "",
        })),
    }
}

export function buildMoldPayload(values: MoldFormValues): MoldInput {
    const { outputs, machineProfiles, lastMaintenanceAt, storageLocation, notes, ...rest } = values

    return {
        ...rest,
        // Tarih-yalnız değer: UTC gece yarısı olarak saklanır, ekranda ilk 10 karakter okunur.
        lastMaintenanceAt: lastMaintenanceAt ? `${lastMaintenanceAt}T00:00:00.000Z` : null,
        storageLocation: storageLocation || null,
        notes: notes || null,
        outputs: outputs.map(({ productSizeId, cavities, partWeightG }) => ({ productSizeId, cavities, partWeightG })),
        machineProfiles: machineProfiles.map((profile) => ({ ...profile, notes: profile.notes || null })),
    }
}
