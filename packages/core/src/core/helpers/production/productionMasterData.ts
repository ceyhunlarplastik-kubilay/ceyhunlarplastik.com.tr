/**
 * Üretim tanımlarının (parkur, makine, kalıp) ortak kuralları — SAF modül, import yok:
 * frontend formu da aynı fonksiyonu `@core/helpers/production/productionMasterData`
 * üzerinden kullanır.
 *
 * Çapraz alan kuralları (min ≤ maks gibi) istek şemasında `.refine()` ile KURULMAZ —
 * `validatorWrapper` yalnız JSON Schema üretir ve refinement sessizce düşer (bkz.
 * CLAUDE.md). Handler bu fonksiyonları çağırır.
 */

/**
 * "m-01 " → "M-01". Kodlar tekil ve büyük/küçük harf duyarsız olmalı; Postgres unique
 * indeksi duyarlı olduğu için yazmadan önce tek biçime çekilir. `toUpperCase` bilinçli
 * olarak locale'siz: sunucu ve tarayıcı aynı sonucu üretmeli.
 */
export function normalizeProductionCode(value: string): string {
    return value.trim().replace(/\s+/g, " ").toUpperCase()
}

export type MachineSpecInput = {
    minMoldHeightMm?: number | null
    maxMoldHeightMm?: number | null
    maxOpeningStrokeMm?: number | null
    /** Plakalar arası maksimum açıklık — hidrolik kapamada açılma buna göre azalır. */
    maxDaylightMm?: number | null
}

export type MachineSpecIssue = {
    /** Formda hatanın gösterileceği alan. */
    field: keyof MachineSpecInput
    message: string
}

/** Boş dizi = tutarlı. Mesajlar kullanıcıya gösterilir. */
export function findMachineSpecIssues(spec: MachineSpecInput): MachineSpecIssue[] {
    const issues: MachineSpecIssue[] = []
    const { minMoldHeightMm: min, maxMoldHeightMm: max, maxOpeningStrokeMm: stroke, maxDaylightMm: daylight } = spec

    if (min != null && max != null && min > max) {
        issues.push({ field: "maxMoldHeightMm", message: "Minimum kalıp kalınlığı maksimumdan büyük olamaz." })
    }

    if (daylight != null) {
        // Açıklığa eşit kalınlıktaki kalıp plakalar arasına sığar ama hiç açılamaz.
        if (min != null && min >= daylight) {
            issues.push({
                field: "minMoldHeightMm",
                message: `Minimum kalıp kalınlığı (${min} mm) plaka açıklığından (${daylight} mm) küçük olmalı.`,
            })
        }
        if (max != null && max >= daylight) {
            issues.push({
                field: "maxMoldHeightMm",
                message: `Maksimum kalıp kalınlığı (${max} mm) plaka açıklığından (${daylight} mm) küçük olmalı; `
                    + "o kalınlıktaki kalıp açılamazdı.",
            })
        }
        if (stroke != null && stroke > daylight) {
            issues.push({
                field: "maxOpeningStrokeMm",
                message: `Açılma stroku (${stroke} mm) plaka açıklığını (${daylight} mm) geçemez.`,
            })
        }
    }

    return issues
}
