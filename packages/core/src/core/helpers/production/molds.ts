/**
 * Kalıp kuralları — SAF modül, import yok: backend handler'ı ile frontend formu
 * (`@core/helpers/production/molds`) AYNI fonksiyonu kullanır.
 *
 * Kalıp ölçüye bağlanır (`MoldOutput` → `ProductSize`): aile kalıbında aynı ürün
 * modelinin farklı ölçüleri de, FARKLI ürün modellerinin ölçüleri de olabilir. Tek
 * baskı tüm gözleri aynı anda doldurur.
 */

export const MAX_MOLD_OUTPUTS = 20
export const MAX_CAVITIES_PER_OUTPUT = 256

export type MoldOutputRule = {
    productSizeId: string
    cavities: number
    partWeightG?: number | null
}

export type MoldMachineProfileRule = {
    machineId: string
    isPreferred: boolean
    isBlocked: boolean
}

/** Boş dizi = geçerli. Mesajlar kullanıcıya gösterilir. */
export function findMoldOutputIssues(outputs: MoldOutputRule[]): string[] {
    const issues: string[] = []

    if (outputs.length > MAX_MOLD_OUTPUTS) {
        issues.push(`Bir kalıpta en fazla ${MAX_MOLD_OUTPUTS} göz grubu olabilir.`)
    }

    const seen = new Set<string>()
    let hasDuplicate = false
    for (const output of outputs) {
        if (seen.has(output.productSizeId)) hasDuplicate = true
        seen.add(output.productSizeId)
    }
    if (hasDuplicate) {
        issues.push("Aynı ölçü kalıpta iki kez tanımlanmış; gözlerini tek satırda toplayın.")
    }

    if (outputs.some((output) => !Number.isInteger(output.cavities) || output.cavities < 1 || output.cavities > MAX_CAVITIES_PER_OUTPUT)) {
        issues.push(`Göz sayısı 1–${MAX_CAVITIES_PER_OUTPUT} arasında bir tam sayı olmalı.`)
    }

    return issues
}

/** Boş dizi = geçerli. */
export function findMoldMachineProfileIssues(profiles: MoldMachineProfileRule[]): string[] {
    const issues: string[] = []

    const seen = new Set<string>()
    let hasDuplicate = false
    for (const profile of profiles) {
        if (seen.has(profile.machineId)) hasDuplicate = true
        seen.add(profile.machineId)
    }
    if (hasDuplicate) {
        issues.push("Aynı makine için birden fazla kart var.")
    }

    if (profiles.some((profile) => profile.isPreferred && profile.isBlocked)) {
        issues.push("Bir makine hem tercih edilen hem engelli olamaz.")
    }

    return issues
}

export type MoldCounterInput = {
    totalShots?: number | null
    shotsAtLastMaintenance?: number | null
}

export function findMoldSpecIssues(spec: MoldCounterInput): string[] {
    if (
        spec.totalShots != null
        && spec.shotsAtLastMaintenance != null
        && spec.shotsAtLastMaintenance > spec.totalShots
    ) {
        return ["Son bakımdaki baskı sayısı toplam baskı sayısından büyük olamaz."]
    }
    return []
}

export function sumCavities(outputs: Array<Pick<MoldOutputRule, "cavities">>): number {
    return outputs.reduce((sum, output) => sum + output.cavities, 0)
}

/**
 * Baskı ağırlığı (g) = Σ(göz × parça ağırlığı) + yolluk. Bir göz grubunun parça ağırlığı
 * eksikse hesap yapılamaz → `null` (uygunluk kontrolü "doğrulanamadı" der).
 */
export function computeShotWeightG(
    outputs: Array<Pick<MoldOutputRule, "cavities" | "partWeightG">>,
    runnerWeightG?: number | null,
): number | null {
    if (outputs.length === 0) return null

    let total = runnerWeightG ?? 0
    for (const output of outputs) {
        if (output.partWeightG == null) return null
        total += output.cavities * output.partWeightG
    }

    return Math.round(total * 100) / 100
}
