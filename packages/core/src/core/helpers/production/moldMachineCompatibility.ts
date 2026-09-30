/**
 * Kalıp × makine uygunluğu — SAF modül: I/O yok, yalnız aynı klasördeki saf modüllerden
 * göreli import (frontend `@core/…` ile okur). Matris ekranı bugün, Faz 2 planlama motoru
 * yarın aday makineleri AYNI fonksiyonla süzer; kural iki yerde ayrışamaz.
 *
 * Her kontrol dört sonuçtan birini verir:
 *  - `ok`       uygun
 *  - `warning`  çalışır ama risk ya da ek iş var (bilezik değişimi, harici sıcak yolluk,
 *               sınırda baskı ağırlığı, makine/kalıp bakımda…)
 *  - `unknown`  bir tarafta değer girilmemiş: plan KİLİTLENMEZ, "doğrulanamadı" gösterilir
 *  - `error`    uygun değil
 * Çiftin hükmü en kötü sonuçtur: error > warning > unknown > ok.
 *
 * Fiziksel kurallar (docs/production-planning.md §10 / 1.6 tasarım girdileri):
 *  - Kolonlar: kalıp BİR yönde kolonların arasından geçmeli — genişliği yatay aralıktan
 *    küçükse yukarıdan iner, yüksekliği dikey aralıktan küçükse yandan girer.
 *  - Kalınlık makinenin aralığında olmalı; plaka açıklığı biliniyorsa ondan küçük olmalı.
 *  - Kullanılabilir açılma = min(strok, açıklık − kalınlık): hidrolik kapamada açılma kalıp
 *    kalınlaştıkça azalır. Dizlili makinede açıklık boş kalır, açılma = strok.
 *  - Baskı ağırlığı kapasitenin %20–80'i olmalı. Kapasite föyde PS cinsindendir; matriste
 *    hammadde yok, hafif hammaddede (PP) payın azaldığı uyarıya yazılır. Kesin hesap Faz 2'de
 *    iş belli bir hammaddeyle planlanırken.
 *  - Sıcak yolluk bölgesi eksikse harici kontrol cihazıyla çalışabilir (dikkat); maça devresi
 *    ya da robot eksikse çalışmaz.
 */
import { computeShotWeightG } from "./molds"

export type CompatibilityLevel = "ok" | "warning" | "unknown" | "error"

/** Hüküm sırası: yüksek olan kazanır. */
const LEVEL_RANK: Record<CompatibilityLevel, number> = { ok: 0, unknown: 1, warning: 2, error: 3 }

export const SHOT_UTILIZATION_MIN = 0.2
export const SHOT_UTILIZATION_MAX = 0.8

export type CompatibilityCheckCode =
    | "BLOCKED_ON_MACHINE"
    | "MACHINE_STATUS"
    | "MOLD_STATUS"
    | "CLAMP_FORCE"
    | "TIE_BARS"
    | "MOLD_THICKNESS"
    | "OPENING_STROKE"
    | "SHOT_WEIGHT"
    | "HOT_RUNNER"
    | "CORE_PULL"
    | "ROBOT"
    | "LOCATING_RING"

export type CompatibilityCheck = {
    code: CompatibilityCheckCode
    label: string
    level: CompatibilityLevel
    message: string
}

export type CompatibilityMachineInput = {
    id: string
    status: "ACTIVE" | "MAINTENANCE" | "BREAKDOWN" | "INACTIVE"
    clampForceTon: number
    tieBarHorizontalMm: number | null
    tieBarVerticalMm: number | null
    minMoldHeightMm: number | null
    maxMoldHeightMm: number | null
    maxOpeningStrokeMm: number | null
    maxDaylightMm: number | null
    shotCapacityG: number | null
    locatingRingDiameterMm: number | null
    hotRunnerZones: number
    coreCircuits: number
    hasRobot: boolean
}

export type CompatibilityMoldInput = {
    status: "ACTIVE" | "IN_MAINTENANCE" | "BROKEN" | "RETIRED"
    requiredClampForceTon: number | null
    widthMm: number | null
    heightMm: number | null
    thicknessMm: number | null
    requiredOpeningStrokeMm: number | null
    locatingRingDiameterMm: number | null
    hotRunnerZones: number
    coreCircuitsRequired: number
    requiresRobot: boolean
    runnerWeightG: number | null
    outputs: Array<{ cavities: number; partWeightG: number | null }>
    machineProfiles: Array<{ machineId: string; isPreferred: boolean; isBlocked: boolean }>
}

export type CompatibilityResult = {
    verdict: CompatibilityLevel
    checks: CompatibilityCheck[]
    /** Kalıp kartında bu makine "tercih edilen" (engelli değilse). */
    isPreferred: boolean
    /** Gerekli tonaj / makine tonajı — ikisi de biliniyorsa. */
    clampUtilization: number | null
    shotWeightG: number | null
    /** Baskı ağırlığı / baskı kapasitesi (PS) — ikisi de biliniyorsa. */
    shotUtilization: number | null
    /** min(strok, açıklık − kalınlık) — hesaplanabiliyorsa. */
    availableOpeningMm: number | null
}

const formatNumber = (value: number) => value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })
const percent = (ratio: number) => `%${Math.round(ratio * 100)}`

function check(code: CompatibilityCheckCode, label: string, level: CompatibilityLevel, message: string): CompatibilityCheck {
    return { code, label, level, message }
}

function statusChecks(mold: CompatibilityMoldInput, machine: CompatibilityMachineInput): CompatibilityCheck[] {
    const checks: CompatibilityCheck[] = []
    const profile = mold.machineProfiles.find((entry) => entry.machineId === machine.id)

    if (profile?.isBlocked) {
        checks.push(check("BLOCKED_ON_MACHINE", "Kalıp kartı", "error", "Kalıp kartında \"bu makinede çalışmaz\" işaretli."))
    }
    if (machine.status === "INACTIVE") {
        checks.push(check("MACHINE_STATUS", "Makine durumu", "error", "Makine kullanım dışı."))
    } else if (machine.status === "MAINTENANCE") {
        checks.push(check("MACHINE_STATUS", "Makine durumu", "warning", "Makine şu an bakımda."))
    } else if (machine.status === "BREAKDOWN") {
        checks.push(check("MACHINE_STATUS", "Makine durumu", "warning", "Makine şu an arızalı."))
    }
    if (mold.status === "RETIRED") {
        checks.push(check("MOLD_STATUS", "Kalıp durumu", "error", "Kalıp kullanım dışı."))
    } else if (mold.status === "IN_MAINTENANCE") {
        checks.push(check("MOLD_STATUS", "Kalıp durumu", "warning", "Kalıp şu an bakımda."))
    } else if (mold.status === "BROKEN") {
        checks.push(check("MOLD_STATUS", "Kalıp durumu", "warning", "Kalıp arızalı."))
    }

    return checks
}

function clampForceCheck(mold: CompatibilityMoldInput, machine: CompatibilityMachineInput): CompatibilityCheck {
    const label = "Kapama kuvveti"
    const required = mold.requiredClampForceTon
    if (required == null) return check("CLAMP_FORCE", label, "unknown", "Kalıbın gerekli kapama kuvveti girilmemiş.")

    const utilization = `(kullanım ${percent(required / machine.clampForceTon)})`
    return required > machine.clampForceTon
        ? check("CLAMP_FORCE", label, "error", `Gerekli ${required} t, makine ${machine.clampForceTon} t — yetmez.`)
        : check("CLAMP_FORCE", label, "ok", `Gerekli ${required} t, makine ${machine.clampForceTon} t ${utilization}.`)
}

function tieBarCheck(mold: CompatibilityMoldInput, machine: CompatibilityMachineInput): CompatibilityCheck {
    const label = "Kolonlar arası"
    const directions = [
        {
            mold: mold.widthMm,
            bar: machine.tieBarHorizontalMm,
            describe: (size: number, bar: number) => `genişlik ${size} mm < yatay ${bar} mm (yukarıdan iner)`,
            name: "Genişlik",
        },
        {
            mold: mold.heightMm,
            bar: machine.tieBarVerticalMm,
            describe: (size: number, bar: number) => `yükseklik ${size} mm < dikey ${bar} mm (yandan girer)`,
            name: "Yükseklik",
        },
    ].filter((direction): direction is typeof direction & { mold: number; bar: number } => (
        direction.mold != null && direction.bar != null
    ))

    if (directions.length === 0) {
        return check("TIE_BARS", label, "unknown", "Kalıbın dış ölçüleri ya da makinenin kolon aralığı girilmemiş.")
    }

    const fitting = directions.find((direction) => direction.mold < direction.bar)
    if (fitting) return check("TIE_BARS", label, "ok", `Geçer: ${fitting.describe(fitting.mold, fitting.bar)}.`)

    if (directions.length < 2) {
        return check("TIE_BARS", label, "unknown", `${directions[0].name} yönünde geçmiyor; diğer yönün ölçüsü girilmemiş.`)
    }
    return check(
        "TIE_BARS",
        label,
        "error",
        `Kolonların arasından geçmez: kalıp ${mold.widthMm} × ${mold.heightMm} mm, kolonlar `
        + `${machine.tieBarHorizontalMm} × ${machine.tieBarVerticalMm} mm.`,
    )
}

function describeHeightRange(machine: CompatibilityMachineInput) {
    const { minMoldHeightMm: min, maxMoldHeightMm: max, maxDaylightMm: daylight } = machine
    if (min != null && max != null) return `makine ${min}–${max} mm`
    if (min != null) return `makinede en az ${min} mm`
    if (max != null) return `makinede en çok ${max} mm`
    return `plaka açıklığı ${daylight} mm`
}

function thicknessCheck(mold: CompatibilityMoldInput, machine: CompatibilityMachineInput): CompatibilityCheck {
    const label = "Kalıp kalınlığı"
    const thickness = mold.thicknessMm
    const { minMoldHeightMm: min, maxMoldHeightMm: max, maxDaylightMm: daylight } = machine

    if (thickness == null) return check("MOLD_THICKNESS", label, "unknown", "Kalıp kalınlığı girilmemiş.")
    if (min == null && max == null && daylight == null) {
        return check("MOLD_THICKNESS", label, "unknown", "Makinenin kalıp kalınlığı aralığı girilmemiş.")
    }
    if (daylight != null && thickness >= daylight) {
        return check("MOLD_THICKNESS", label, "error", `Kalınlık ${thickness} mm, plaka açıklığı ${daylight} mm — kalıp açılamaz.`)
    }
    if (min != null && thickness < min) {
        return check("MOLD_THICKNESS", label, "error", `Kalınlık ${thickness} mm, makinenin en incesi ${min} mm — ara plaka gerekir.`)
    }
    if (max != null && thickness > max) {
        return check("MOLD_THICKNESS", label, "error", `Kalınlık ${thickness} mm, makinenin en kalını ${max} mm.`)
    }
    return check("MOLD_THICKNESS", label, "ok", `Kalınlık ${thickness} mm (${describeHeightRange(machine)}).`)
}

/** min(strok, açıklık − kalınlık); hesaplanamıyorsa `null`. */
export function availableOpeningMm(
    machine: Pick<CompatibilityMachineInput, "maxOpeningStrokeMm" | "maxDaylightMm">,
    moldThicknessMm: number | null,
): number | null {
    const byDaylight = machine.maxDaylightMm != null && moldThicknessMm != null
        ? machine.maxDaylightMm - moldThicknessMm
        : null
    const limits = [machine.maxOpeningStrokeMm, byDaylight].filter((value): value is number => value != null)
    return limits.length > 0 ? Math.min(...limits) : null
}

function openingCheck(mold: CompatibilityMoldInput, machine: CompatibilityMachineInput): CompatibilityCheck {
    const label = "Açılma"
    const required = mold.requiredOpeningStrokeMm
    const available = availableOpeningMm(machine, mold.thicknessMm)

    if (required == null) return check("OPENING_STROKE", label, "unknown", "Kalıbın gerekli açılması girilmemiş.")
    if (available == null) {
        return check(
            "OPENING_STROKE",
            label,
            "unknown",
            machine.maxDaylightMm != null
                ? "Kalıp kalınlığı girilmemiş; plaka açıklığından kalan açılma hesaplanamadı."
                : "Makinenin açılma stroku girilmemiş.",
        )
    }

    const limitedByDaylight = machine.maxDaylightMm != null
        && mold.thicknessMm != null
        && (machine.maxOpeningStrokeMm == null || machine.maxDaylightMm - mold.thicknessMm < machine.maxOpeningStrokeMm)
    const source = limitedByDaylight ? `açıklık ${machine.maxDaylightMm} − kalınlık ${mold.thicknessMm}` : "strok"

    return required > available
        ? check("OPENING_STROKE", label, "error", `Gerekli ${required} mm, kullanılabilir ${Math.max(0, available)} mm (${source}).`)
        : check("OPENING_STROKE", label, "ok", `Gerekli ${required} mm, kullanılabilir ${available} mm (${source}).`)
}

function shotWeightCheck(
    mold: CompatibilityMoldInput,
    machine: CompatibilityMachineInput,
    shotWeightG: number | null,
): CompatibilityCheck {
    const label = "Baskı ağırlığı"
    const capacity = machine.shotCapacityG

    if (mold.outputs.length === 0) {
        return check("SHOT_WEIGHT", label, "unknown", "Kalıbın göz grubu yok; baskı ağırlığı hesaplanamadı.")
    }
    if (shotWeightG == null) {
        return check("SHOT_WEIGHT", label, "unknown", "Parça ağırlığı girilmemiş göz grubu var; baskı ağırlığı hesaplanamadı.")
    }
    if (capacity == null) return check("SHOT_WEIGHT", label, "unknown", "Makinenin baskı kapasitesi girilmemiş.")

    const ratio = shotWeightG / capacity
    const base = `Baskı ${formatNumber(shotWeightG)} g, kapasite ${formatNumber(capacity)} g (doluluk ${percent(ratio)})`
    if (ratio > 1) return check("SHOT_WEIGHT", label, "error", `${base} — sığmaz.`)
    if (ratio > SHOT_UTILIZATION_MAX) {
        return check(
            "SHOT_WEIGHT",
            label,
            "warning",
            `${base} — sınırda. Kapasite PS cinsinden; PP gibi hafif hammaddede pay daha da azalır.`,
        )
    }
    if (ratio < SHOT_UTILIZATION_MIN) {
        return check("SHOT_WEIGHT", label, "warning", `${base} — çok küçük; malzeme kovanda uzun bekler.`)
    }
    return check("SHOT_WEIGHT", label, "ok", `${base}; kapasite PS cinsinden.`)
}

function equipmentChecks(mold: CompatibilityMoldInput, machine: CompatibilityMachineInput): CompatibilityCheck[] {
    const checks: CompatibilityCheck[] = []

    if (mold.hotRunnerZones > 0) {
        checks.push(machine.hotRunnerZones >= mold.hotRunnerZones
            ? check("HOT_RUNNER", "Sıcak yolluk", "ok", `Kalıp ${mold.hotRunnerZones} bölge, makinede ${machine.hotRunnerZones}.`)
            : check(
                "HOT_RUNNER",
                "Sıcak yolluk",
                "warning",
                `Kalıp ${mold.hotRunnerZones} bölge ister, makinede ${machine.hotRunnerZones} — harici kontrol cihazı gerekir.`,
            ))
    }
    if (mold.coreCircuitsRequired > 0) {
        checks.push(machine.coreCircuits >= mold.coreCircuitsRequired
            ? check("CORE_PULL", "Maça çekme", "ok", `Kalıp ${mold.coreCircuitsRequired} devre, makinede ${machine.coreCircuits}.`)
            : check(
                "CORE_PULL",
                "Maça çekme",
                "error",
                `Kalıp ${mold.coreCircuitsRequired} maça devresi ister, makinede ${machine.coreCircuits}.`,
            ))
    }
    if (mold.requiresRobot) {
        checks.push(machine.hasRobot
            ? check("ROBOT", "Robot", "ok", "Makinede robot var.")
            : check("ROBOT", "Robot", "error", "Kalıp robot ister, makinede robot yok."))
    }
    // Bilezik yalnız iki taraf da biliniyorsa değerlendirilir: eksik bilezik bilgisi kalıbı
    // "doğrulanamadı"ya düşürmeye değmez, değiştirmesi dakikalık iştir.
    if (mold.locatingRingDiameterMm != null && machine.locatingRingDiameterMm != null) {
        checks.push(mold.locatingRingDiameterMm === machine.locatingRingDiameterMm
            ? check("LOCATING_RING", "Merkezleme bileziği", "ok", `${mold.locatingRingDiameterMm} mm.`)
            : check(
                "LOCATING_RING",
                "Merkezleme bileziği",
                "warning",
                `Kalıp ${mold.locatingRingDiameterMm} mm, makine ${machine.locatingRingDiameterMm} mm — bilezik ya da adaptör değişimi gerekir.`,
            ))
    }

    return checks
}

export function evaluateMoldMachineCompatibility(
    mold: CompatibilityMoldInput,
    machine: CompatibilityMachineInput,
): CompatibilityResult {
    const shotWeightG = computeShotWeightG(mold.outputs, mold.runnerWeightG)
    const checks = [
        ...statusChecks(mold, machine),
        clampForceCheck(mold, machine),
        tieBarCheck(mold, machine),
        thicknessCheck(mold, machine),
        openingCheck(mold, machine),
        shotWeightCheck(mold, machine, shotWeightG),
        ...equipmentChecks(mold, machine),
    ]
    const verdict = checks.reduce<CompatibilityLevel>(
        (worst, entry) => (LEVEL_RANK[entry.level] > LEVEL_RANK[worst] ? entry.level : worst),
        "ok",
    )
    const profile = mold.machineProfiles.find((entry) => entry.machineId === machine.id)

    return {
        verdict,
        checks,
        isPreferred: Boolean(profile?.isPreferred && !profile.isBlocked),
        clampUtilization: mold.requiredClampForceTon == null ? null : mold.requiredClampForceTon / machine.clampForceTon,
        shotWeightG,
        shotUtilization: shotWeightG == null || machine.shotCapacityG == null ? null : shotWeightG / machine.shotCapacityG,
        availableOpeningMm: availableOpeningMm(machine, mold.thicknessMm),
    }
}

/**
 * Bir kalıp için önerilen makine. Aday: uygun (✓) ya da dikkatle uygun (⚠) olanlar —
 * doğrulanamayan (?) ve uygun olmayan (✗) önerilmez. Sıra: kalıp kartında tercih edilen →
 * ✓ olan ⚠ olandan önce → EN KÜÇÜK yeterli pres (daha düşük saat maliyeti ve enerji) → kod.
 */
export function recommendMachineForMold<TMachine extends { id: string; code: string; clampForceTon: number }>(
    entries: Array<{ machine: TMachine; result: CompatibilityResult }>,
): string | null {
    const candidates = entries.filter(({ result }) => result.verdict === "ok" || result.verdict === "warning")
    const [best] = [...candidates].sort((a, b) => (
        Number(b.result.isPreferred) - Number(a.result.isPreferred)
        || LEVEL_RANK[a.result.verdict] - LEVEL_RANK[b.result.verdict]
        || a.machine.clampForceTon - b.machine.clampForceTon
        || a.machine.code.localeCompare(b.machine.code)
    ))
    return best?.machine.id ?? null
}
