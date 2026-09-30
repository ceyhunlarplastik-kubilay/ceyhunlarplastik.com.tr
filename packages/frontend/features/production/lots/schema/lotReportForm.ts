import { z } from "zod"

import { MAX_OUTPUT_QUANTITY, type ProductionJobStatus } from "@core/helpers/production/jobStateMachine"
import { findLotReportIssues, MAX_LOT_DURATION_MINUTES } from "@core/helpers/production/lotReports"
import { findLotNoteIssue } from "@core/helpers/production/productionLots"
import type { ProductionReasonKind } from "@core/helpers/production/productionReasons"
import { utcToWallTime, wallTimeToUtc } from "@core/helpers/production/productionTime"
import type { LotDetail, LotReportInput } from "@/features/production/lots/api/types"
import { optionalIntegerField, requiredIntegerField } from "@/features/production/shared/formNumbers"

/**
 * Vardiya raporu formu. Sayılar formda METİN (boş bırakılabilsin), saatler FABRİKA saatiyle
 * `datetime-local`. Kural sunucuyla aynı fonksiyondan (`findLotReportIssues`) — superRefine.
 */

export const NO_OPERATOR = "__none__"
const quantity = { min: 0, max: MAX_OUTPUT_QUANTITY }

export type LotReportFormContext = {
    jobOutputIds: string[]
    jobStatus: ProductionJobStatus
    reasons: Array<{ id: string; kind: ProductionReasonKind; isActive: boolean }>
    keptReasonIds: string[]
    now: Date
}

/** Çekirdek alan adı ("outputs.0.scrapReasons.1") → form yolu (satırda neden seçicisine bağlanır). */
export function toFormPath(field: string): Array<string | number> {
    const path: Array<string | number> = field.split(".").map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment))
    if (path.length >= 2 && typeof path[path.length - 1] === "number" && path[path.length - 2] === "scrapReasons") path.push("reasonId")
    return path
}

export function lotReportFormSchema(context: LotReportFormContext) {
    return z.object({
        actualStartAt: z.string(),
        actualEndAt: z.string(),
        actualShots: optionalIntegerField("Baskı", quantity),
        outputs: z.array(z.object({
            jobOutputId: z.string(),
            goodQuantity: requiredIntegerField("Sağlam", quantity),
            scrapQuantity: requiredIntegerField("Fire", quantity),
            scrapReasons: z.array(z.object({ reasonId: z.string().min(1, "Neden seçin"), quantity: requiredIntegerField("Adet", { min: 1, max: MAX_OUTPUT_QUANTITY }) })),
        })),
        stops: z.array(z.object({
            reasonId: z.string().min(1, "Neden seçin"),
            durationMinutes: requiredIntegerField("Süre", { min: 1, max: MAX_LOT_DURATION_MINUTES }),
            startAt: z.string(),
            note: z.string().max(500),
        })),
        handoverNote: z.string(),
        handoverOperatorId: z.string(),
    }).superRefine((values, ctx) => {
        const start = wallTimeToUtc(values.actualStartAt)
        const end = wallTimeToUtc(values.actualEndAt)
        if (!start) ctx.addIssue({ code: "custom", path: ["actualStartAt"], message: "Geçerli bir tarih ve saat girin." })
        if (!end) ctx.addIssue({ code: "custom", path: ["actualEndAt"], message: "Geçerli bir tarih ve saat girin." })
        if (!start || !end) return
        const stops = values.stops.map((stop, index) => {
            const stopStart = stop.startAt ? wallTimeToUtc(stop.startAt) : null
            if (stop.startAt && !stopStart) ctx.addIssue({ code: "custom", path: ["stops", index, "startAt"], message: "Geçerli bir saat girin." })
            return { reasonId: stop.reasonId, durationMinutes: stop.durationMinutes, startAt: stopStart }
        })
        const issues = findLotReportIssues({
            report: { actualStartAt: start, actualEndAt: end, actualShots: values.actualShots, outputs: values.outputs, stops },
            ...context,
        })
        for (const issue of issues) ctx.addIssue({ code: "custom", path: toFormPath(issue.field), message: issue.message })
        if (values.handoverNote.trim()) {
            const noteIssue = findLotNoteIssue(values.handoverNote)
            if (noteIssue) ctx.addIssue({ code: "custom", path: ["handoverNote"], message: noteIssue })
        }
    })
}

export type LotReportFormInput = z.input<ReturnType<typeof lotReportFormSchema>>
export type LotReportFormOutput = z.output<ReturnType<typeof lotReportFormSchema>>

const text = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value))

/**
 * Varsayılanlar: raporlanmış lotta mevcut rapor; yoksa planlı saatler, fire 0, sağlam BOŞ (planlanan
 * adet ipucu olarak gösterilir — gerçekleşen yerine planlananın onaylanıp geçilmesin diye).
 */
export function lotReportFormDefaults(lot: LotDetail): LotReportFormInput {
    const reported = lot.reportedAt !== null
    return {
        actualStartAt: utcToWallTime(lot.actualStartAt ?? lot.plannedStartAt),
        actualEndAt: utcToWallTime(lot.actualEndAt ?? lot.plannedEndAt),
        actualShots: reported ? text(lot.actualShots) : "",
        outputs: lot.outputs.map((output) => ({
            jobOutputId: output.jobOutputId,
            goodQuantity: reported ? text(output.goodQuantity) : "",
            scrapQuantity: reported ? text(output.scrapQuantity) : "0",
            scrapReasons: output.scrapReasons.map((entry) => ({ reasonId: entry.reason.id, quantity: text(entry.quantity) })),
        })),
        stops: lot.stops.map((stop) => ({
            reasonId: stop.reason.id,
            durationMinutes: text(stop.durationMinutes),
            startAt: stop.startAt ? utcToWallTime(stop.startAt) : "",
            note: stop.note ?? "",
        })),
        handoverNote: "",
        handoverOperatorId: NO_OPERATOR,
    }
}

export function toLotReportInput(values: LotReportFormOutput, jobVersion: number): LotReportInput {
    return {
        actualStartAt: (wallTimeToUtc(values.actualStartAt) as Date).toISOString(),
        actualEndAt: (wallTimeToUtc(values.actualEndAt) as Date).toISOString(),
        actualShots: values.actualShots,
        outputs: values.outputs,
        stops: values.stops.map((stop) => ({
            reasonId: stop.reasonId,
            durationMinutes: stop.durationMinutes,
            startAt: stop.startAt ? (wallTimeToUtc(stop.startAt) as Date).toISOString() : null,
            note: stop.note.trim() || null,
        })),
        handoverNote: values.handoverNote.trim()
            ? { body: values.handoverNote.trim(), operatorId: values.handoverOperatorId === NO_OPERATOR ? null : values.handoverOperatorId }
            : null,
        expectedVersion: jobVersion,
    }
}
