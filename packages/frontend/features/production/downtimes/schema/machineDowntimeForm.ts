import { z } from "zod"

import { findMachineDowntimeIssues } from "@core/helpers/production/machineDowntimes"
import { addDaysToDateKey } from "@core/helpers/production/productionCalendar"
import { utcToWallTime, wallTimeToUtc } from "@core/helpers/production/productionTime"
import type { MachineDowntime, MachineDowntimeInput } from "@/features/production/downtimes/api/types"

/**
 * Duruş formu. Zamanlar formda FABRİKA duvar saatidir (`<input type="datetime-local">`,
 * "2026-09-28T08:00"); gönderirken UTC'ye çevrilir. Tarayıcının saat dilimi KULLANILMAZ
 * (core `productionTime.ts`). Aralık kuralları sunucudakiyle aynı fonksiyon.
 */
export const machineDowntimeFormSchema = z.object({
    machineId: z.string().min(1, "Makine seçin"),
    kind: z.enum(["PLANNED_MAINTENANCE", "BREAKDOWN", "OTHER"]),
    startAt: z.string().min(1, "Başlangıç zorunlu"),
    endAt: z.string().min(1, "Bitiş zorunlu"),
    reason: z.string().trim().max(2000, "En fazla 2000 karakter"),
}).superRefine((values, ctx) => {
    const startAt = values.startAt ? wallTimeToUtc(values.startAt) : null
    const endAt = values.endAt ? wallTimeToUtc(values.endAt) : null

    if (values.startAt && !startAt) ctx.addIssue({ code: "custom", path: ["startAt"], message: "Başlangıç zamanı geçersiz" })
    if (values.endAt && !endAt) ctx.addIssue({ code: "custom", path: ["endAt"], message: "Bitiş zamanı geçersiz" })
    if (!startAt || !endAt) return

    for (const issue of findMachineDowntimeIssues({ startAt, endAt })) {
        ctx.addIssue({ code: "custom", path: ["endAt"], message: issue.message })
    }
})

export type MachineDowntimeFormValues = z.infer<typeof machineDowntimeFormSchema>

/**
 * Yeni kayıtta varsayılan: yarın 08:00–16:00 (fabrika saati) planlı bakım — en sık
 * girilecek durum. `today` fabrika takvimindeki bugün ("YYYY-MM-DD").
 */
export function createMachineDowntimeFormDefaults(
    downtime: MachineDowntime | null | undefined,
    options: { today: string; machineId?: string },
): MachineDowntimeFormValues {
    if (downtime) {
        return {
            machineId: downtime.machineId,
            kind: downtime.kind,
            startAt: utcToWallTime(downtime.startAt),
            endAt: utcToWallTime(downtime.endAt),
            reason: downtime.reason ?? "",
        }
    }

    const tomorrow = addDaysToDateKey(options.today, 1)
    return {
        machineId: options.machineId ?? "",
        kind: "PLANNED_MAINTENANCE",
        startAt: `${tomorrow}T08:00`,
        endAt: `${tomorrow}T16:00`,
        reason: "",
    }
}

/** Şema doğrulamasından geçmiş değerler için: fabrika saati → UTC ISO. */
export function buildMachineDowntimePayload(values: MachineDowntimeFormValues): MachineDowntimeInput {
    const startAt = wallTimeToUtc(values.startAt)
    const endAt = wallTimeToUtc(values.endAt)
    if (!startAt || !endAt) throw new Error("Duruş zamanı doğrulanmadan gönderildi")

    return {
        machineId: values.machineId,
        kind: values.kind,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        reason: values.reason || null,
    }
}
