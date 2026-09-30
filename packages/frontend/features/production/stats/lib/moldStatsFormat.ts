import { isMaintenanceAlert } from "@core/helpers/production/moldMaintenance"
import type { MoldMachineCycleStats, MoldStatsRow, MoldVersionCycleStats } from "@/features/production/stats/api/types"
import { cycleDeviation, formatCycle } from "@/features/production/stats/lib/productHistoryFormat"

/**
 * Kalıp istatistikleri (5.3) — SAF gösterim ve süzgeç yardımcıları. Hesap ve öneri kuralı sunucuda
 * (core `moldStats.ts`); burada yalnız metin ve istemci süzgeci (liste tek çağrıda geliyor).
 */

export type MoldStatsFilter = {
    search: string
    onlySuggestions: boolean
    onlyMaintenance: boolean
}

/** Bakım uyarısı: kullanımdaki kalıpta şimdi ya da planlı işlerle yaklaşıyor / geldi (uyarı taramasıyla aynı). */
export function hasMaintenanceAlert(row: Pick<MoldStatsRow, "status" | "maintenance">): boolean {
    return row.status === "ACTIVE" && isMaintenanceAlert(row.maintenance)
}

/** Kod, ad ya da makine kodunda arama (Türkçe küçük harf); önerisi / bakım uyarısı olanlar. */
export function filterMoldStatsRows(rows: MoldStatsRow[], filter: MoldStatsFilter): MoldStatsRow[] {
    const needle = filter.search.trim().toLocaleLowerCase("tr-TR")
    return rows.filter((row) => {
        if (filter.onlySuggestions && row.suggestionCount === 0) return false
        if (filter.onlyMaintenance && !hasMaintenanceAlert(row)) return false
        if (!needle) return true
        return [row.code, row.name, ...row.machines.map((machine) => machine.machineCode)]
            .some((value) => value.toLocaleLowerCase("tr-TR").includes(needle))
    })
}

/** "Siyah · PP"; renksiz ayarda "Renksiz · PP"; eşleşen versiyon yoksa "Tanımsız ayar". */
export function versionLabel(version: Pick<MoldVersionCycleStats, "colorName" | "materials">): string {
    if (!version.colorName && version.materials.length === 0) return "Tanımsız ayar"
    return [version.colorName ?? "Renksiz", version.materials.join("/")].filter(Boolean).join(" · ")
}

/** "Gerçek 24,0 sn · kart 20,0 sn (+%20,0)" — öneri düğmesinin açıklaması. */
export function suggestionReason(machine: Pick<MoldMachineCycleStats, "actualCycleSec" | "suggestion">): string | null {
    if (!machine.suggestion) return null
    const deviation = cycleDeviation(machine.actualCycleSec, machine.suggestion.referenceSec)
    const reference = machine.suggestion.referenceSource === "card" ? "kart" : "plan"
    return `Gerçek ${formatCycle(machine.actualCycleSec)} · ${reference} ${formatCycle(machine.suggestion.referenceSec)}${deviation ? ` (${deviation.text})` : ""}`
}
