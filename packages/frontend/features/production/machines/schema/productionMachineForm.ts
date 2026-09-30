import { z } from "zod"

import { findMachineSpecIssues } from "@core/helpers/production/productionMasterData"
import type { ProductionMachine, ProductionMachineInput } from "@/features/production/machines/api/types"
import {
    optionalDecimalField,
    optionalIntegerField,
    requiredIntegerField,
    toFieldText,
} from "@/features/production/shared/formNumbers"

const MILLIMETERS = { min: 1, max: 20000 }

/**
 * Makine formu. Teknik değerlerin çoğu opsiyonel: boş bırakılan alan uygunluk
 * kontrolünde "doğrulanamadı" uyarısı üretir, kaydı engellemez. Çapraz kurallar
 * (min ≤ maks, kalınlık ve strok < plaka açıklığı) sunucudakiyle AYNI fonksiyon: core
 * `findMachineSpecIssues`.
 */
export const productionMachineFormSchema = z.object({
    code: z.string().trim().min(1, "Kod zorunlu").max(20, "En fazla 20 karakter"),
    name: z.string().trim().min(1, "Ad zorunlu").max(120, "En fazla 120 karakter"),
    brand: z.string().trim().max(80, "En fazla 80 karakter"),
    model: z.string().trim().max(80, "En fazla 80 karakter"),
    serialNumber: z.string().trim().max(80, "En fazla 80 karakter"),
    manufactureYear: optionalIntegerField("Üretim yılı", { min: 1950, max: 2100 }),
    areaId: z.string().min(1, "Alan seçin"),
    status: z.enum(["ACTIVE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"]),
    clampForceTon: requiredIntegerField("Kapama kuvveti", { min: 1, max: 10000 }),
    tieBarHorizontalMm: optionalIntegerField("Yatay kolon arası", MILLIMETERS),
    tieBarVerticalMm: optionalIntegerField("Dikey kolon arası", MILLIMETERS),
    minMoldHeightMm: optionalIntegerField("Min. kalıp kalınlığı", MILLIMETERS),
    maxMoldHeightMm: optionalIntegerField("Maks. kalıp kalınlığı", MILLIMETERS),
    maxOpeningStrokeMm: optionalIntegerField("Açılma stroku", MILLIMETERS),
    maxDaylightMm: optionalIntegerField("Plaka açıklığı", MILLIMETERS),
    shotCapacityG: optionalDecimalField("Baskı kapasitesi", { min: 0.1, max: 1_000_000 }),
    screwDiameterMm: optionalIntegerField("Vida çapı", { min: 1, max: 1000 }),
    locatingRingDiameterMm: optionalIntegerField("Merkezleme bileziği", { min: 1, max: 1000 }),
    hotRunnerZones: requiredIntegerField("Sıcak yolluk bölgesi", { min: 0, max: 200 }),
    coreCircuits: requiredIntegerField("Maça devresi", { min: 0, max: 50 }),
    hasRobot: z.boolean(),
    plannedEfficiencyPercent: requiredIntegerField("Planlama verimi", { min: 1, max: 100 }),
    hourlyCost: optionalDecimalField("Saat maliyeti", { min: 0, max: 10_000_000 }),
    shiftPatternId: z.string(),
    sortOrder: requiredIntegerField("Sıra", { min: 0, max: 9999 }),
    notes: z.string().trim().max(5000, "En fazla 5000 karakter"),
}).superRefine((values, ctx) => {
    for (const issue of findMachineSpecIssues(values)) {
        ctx.addIssue({ code: "custom", path: [issue.field], message: issue.message })
    }
})

export type ProductionMachineFormInput = z.input<typeof productionMachineFormSchema>
export type ProductionMachineFormValues = z.output<typeof productionMachineFormSchema>

export function createProductionMachineFormDefaults(
    machine?: ProductionMachine | null,
    fallbackAreaId = "",
): ProductionMachineFormInput {
    return {
        code: machine?.code ?? "",
        name: machine?.name ?? "",
        brand: machine?.brand ?? "",
        model: machine?.model ?? "",
        serialNumber: machine?.serialNumber ?? "",
        manufactureYear: toFieldText(machine?.manufactureYear),
        areaId: machine?.areaId ?? fallbackAreaId,
        status: machine?.status ?? "ACTIVE",
        clampForceTon: toFieldText(machine?.clampForceTon),
        tieBarHorizontalMm: toFieldText(machine?.tieBarHorizontalMm),
        tieBarVerticalMm: toFieldText(machine?.tieBarVerticalMm),
        minMoldHeightMm: toFieldText(machine?.minMoldHeightMm),
        maxMoldHeightMm: toFieldText(machine?.maxMoldHeightMm),
        maxOpeningStrokeMm: toFieldText(machine?.maxOpeningStrokeMm),
        maxDaylightMm: toFieldText(machine?.maxDaylightMm),
        shotCapacityG: toFieldText(machine?.shotCapacityG),
        screwDiameterMm: toFieldText(machine?.screwDiameterMm),
        locatingRingDiameterMm: toFieldText(machine?.locatingRingDiameterMm),
        hotRunnerZones: toFieldText(machine?.hotRunnerZones ?? 0),
        coreCircuits: toFieldText(machine?.coreCircuits ?? 0),
        hasRobot: machine?.hasRobot ?? false,
        plannedEfficiencyPercent: toFieldText(machine?.plannedEfficiencyPercent ?? 85),
        hourlyCost: toFieldText(machine?.hourlyCost),
        shiftPatternId: machine?.shiftPatternId ?? "",
        sortOrder: toFieldText(machine?.sortOrder ?? 0),
        notes: machine?.notes ?? "",
    }
}

export function buildProductionMachinePayload(values: ProductionMachineFormValues): ProductionMachineInput {
    return {
        ...values,
        brand: values.brand || null,
        model: values.model || null,
        serialNumber: values.serialNumber || null,
        shiftPatternId: values.shiftPatternId || null,
        notes: values.notes || null,
    }
}
