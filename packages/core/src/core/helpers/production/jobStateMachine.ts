/**
 * Üretim İŞİ durum makinesi — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 * Kanban sürüklemesi, kartın "Durumu değiştir" menüsü ve ileride operatör aksiyonları AYNI
 * kurala uyar. Emrin durumu elle değil, işlerinden türetilir (`deriveOrderStatusFromJobs`).
 *
 *   Planlandı ⇄ Sahaya verildi → Kalıp bağlanıyor → Üretimde ⇄ Duraklatıldı → Tamamlandı
 *
 *  - Sahaya verilen iş tahtada kilitlidir (taşımak için Planlandı'ya geri çekilir).
 *  - Bağlama sırasında da duraklatılabilir (kalıp arızası vb.); duraklatılan iş Üretimde'ye döner.
 *  - Tamamlama her göz grubu için sağlam + fire adedi ister; tamamlanan iş kapanır (düzeltme Faz 4).
 *  - İptal (silme) yalnız Planlandı iş için ayrı uçtan (`DELETE /production/jobs/{id}`).
 */
import type { ProductionOrderStatus } from "./productionOrders"

export type ProductionJobStatus = "PLANNED" | "RELEASED" | "SETUP" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED"

/** Durum adları — pano sütunu, rozet ve hata mesajları tek kaynaktan. */
export const JOB_STATUS_LABELS: Record<ProductionJobStatus, string> = {
    PLANNED: "Planlandı",
    RELEASED: "Sahaya verildi",
    SETUP: "Kalıp bağlanıyor",
    RUNNING: "Üretimde",
    PAUSED: "Duraklatıldı",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
}

/** Panodaki sütun sırası. */
export const KANBAN_JOB_STATUSES: ProductionJobStatus[] = ["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED"]

/** Sahaya verilmiş, kapanmamış iş — makineyi planı bitse de tutmaya devam eder. */
export const ON_FLOOR_JOB_STATUSES: ProductionJobStatus[] = ["RELEASED", "SETUP", "RUNNING", "PAUSED"]

const TRANSITIONS: Record<ProductionJobStatus, ProductionJobStatus[]> = {
    PLANNED: ["RELEASED"],
    RELEASED: ["PLANNED", "SETUP"],
    SETUP: ["RUNNING", "PAUSED"],
    RUNNING: ["PAUSED", "COMPLETED"],
    PAUSED: ["RUNNING", "COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
}

export function allowedJobTransitions(from: ProductionJobStatus): ProductionJobStatus[] {
    return TRANSITIONS[from]
}

export function canTransitionJob(from: ProductionJobStatus, to: ProductionJobStatus): boolean {
    return TRANSITIONS[from].includes(to)
}

/** Geçiş eylemi adı — menü ve bildirimde. */
export const JOB_TRANSITION_LABELS: Record<ProductionJobStatus, string> = {
    PLANNED: "Planlamaya geri çek",
    RELEASED: "Sahaya ver",
    SETUP: "Kalıp bağlamaya başla",
    RUNNING: "Üretime başla / devam et",
    PAUSED: "Duraklat",
    COMPLETED: "Tamamla",
    CANCELLED: "İptal et",
}

export type JobCompletionOutput = { jobOutputId: string; goodQuantity: number; scrapQuantity: number }

export type JobCompletionIssue = { jobOutputId: string | null; message: string }

/** En büyük tek çıktı adedi — yazım hatasına karşı (plan adedinin katı değil, mutlak sınır). */
export const MAX_OUTPUT_QUANTITY = 100_000_000

/**
 * Tamamlama adetleri: işin HER çıktısı için tam bir satır; tamsayı, 0 ≤ adet ≤ sınır. Sağlam +
 * fire 0 olabilir (gözü kapatılan çıktı). Planlanandan fazlası serbest (fazla basım olur).
 */
export function findJobCompletionIssues(input: {
    jobOutputIds: string[]
    outputs: JobCompletionOutput[] | undefined
}): JobCompletionIssue[] {
    const issues: JobCompletionIssue[] = []
    const outputs = input.outputs ?? []
    const seen = new Set<string>()
    for (const output of outputs) {
        if (!input.jobOutputIds.includes(output.jobOutputId)) {
            issues.push({ jobOutputId: output.jobOutputId, message: "Bu çıktı işe ait değil." })
            continue
        }
        if (seen.has(output.jobOutputId)) issues.push({ jobOutputId: output.jobOutputId, message: "Aynı çıktı iki kez girilmiş." })
        seen.add(output.jobOutputId)
        for (const [label, value] of [["Sağlam", output.goodQuantity], ["Fire", output.scrapQuantity]] as const) {
            if (!Number.isInteger(value) || value < 0 || value > MAX_OUTPUT_QUANTITY) {
                issues.push({ jobOutputId: output.jobOutputId, message: `${label} adedi 0 ile ${MAX_OUTPUT_QUANTITY.toLocaleString("tr-TR")} arasında tam sayı olmalı.` })
            }
        }
    }
    const missing = input.jobOutputIds.filter((id) => !seen.has(id))
    if (missing.length > 0) issues.push({ jobOutputId: null, message: "Tamamlamak için her çıktının sağlam ve fire adedi girilmeli." })
    return issues
}

/** Emrin durumunun işlerden türetildiği durumlar; taslak / beklemede / iptal elle yönetilir. */
const DERIVED_ORDER_STATUSES: ProductionOrderStatus[] = ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED"]

/**
 * Emrin işlerinden türeyen durumu. İş yoksa ya da emir elle yönetilen bir durumdaysa `null`
 * (dokunma). Tüm işler bitti → Tamamlandı; herhangi biri sahada çalışıyor / duraklatılmış / bir
 * kısmı bitmiş → Üretimde; sahaya verilmiş iş var → Serbest; aksi hâlde Planlandı.
 */
export function deriveOrderStatusFromJobs(
    current: ProductionOrderStatus,
    jobStatuses: ProductionJobStatus[],
): ProductionOrderStatus | null {
    if (!DERIVED_ORDER_STATUSES.includes(current)) return null
    const statuses = jobStatuses.filter((status) => status !== "CANCELLED")
    if (statuses.length === 0) return null
    if (statuses.every((status) => status === "COMPLETED")) return "COMPLETED"
    if (statuses.some((status) => status === "SETUP" || status === "RUNNING" || status === "PAUSED" || status === "COMPLETED")) return "IN_PROGRESS"
    if (statuses.some((status) => status === "RELEASED")) return "RELEASED"
    return "PLANNED"
}
