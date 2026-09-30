/**
 * Üretim emri kuralları — SAF modül (frontend `@core/…` ile okur; yalnız göreli import).
 * Backend doğrulaması ile form AYNI fonksiyonlardan geçer.
 *
 *  - Emir numarası otomatik artan bir sayıdır, ekranda "UE-1001" diye yazılır.
 *  - Bu aşamada (Dilim 2.1) elle verilebilen durumlar: Taslak, Beklemede, İptal. Planlandı /
 *    Sahaya verildi / Üretimde / Tamamlandı planlama ve sahadan gelir (Dilim 2.3+).
 *  - Yalnız Taslak ve Beklemede emrin içeriği değişir; yalnız Taslak silinir (iptal kalıcı kayıttır).
 */
import { daysBetweenDateKeys, formatDateKey, isValidDateKey } from "./productionCalendar"

export const PRODUCTION_ORDER_NUMBER_PREFIX = "UE-"
export const MAX_PRODUCTION_ORDER_QUANTITY = 10_000_000

export type ProductionOrderStatus =
    | "DRAFT"
    | "PLANNED"
    | "RELEASED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "ON_HOLD"

export type ProductionOrderSource = "MANUAL" | "STOCK" | "CUSTOMER_ORDER"

/** Listede varsayılan olarak görünen (kapanmamış) durumlar. */
export const OPEN_PRODUCTION_ORDER_STATUSES: ProductionOrderStatus[] = [
    "DRAFT",
    "PLANNED",
    "RELEASED",
    "IN_PROGRESS",
    "ON_HOLD",
]

export const MANUAL_PRODUCTION_ORDER_STATUSES: ProductionOrderStatus[] = ["DRAFT", "ON_HOLD", "CANCELLED"]

export function formatProductionOrderNumber(orderNumber: number): string {
    return `${PRODUCTION_ORDER_NUMBER_PREFIX}${orderNumber}`
}

/** "UE-1001", "ue1001", "1001" → 1001; sayı değilse `null`. */
export function parseProductionOrderNumber(text: string): number | null {
    const match = /^\s*(?:ue-?)?(\d{1,9})\s*$/i.exec(text)
    return match ? Number(match[1]) : null
}

export function canSetProductionOrderStatusManually(from: ProductionOrderStatus, to: ProductionOrderStatus): boolean {
    return from !== to
        && MANUAL_PRODUCTION_ORDER_STATUSES.includes(from)
        && MANUAL_PRODUCTION_ORDER_STATUSES.includes(to)
}

export function isProductionOrderContentEditable(status: ProductionOrderStatus): boolean {
    return status === "DRAFT" || status === "ON_HOLD"
}

export function isProductionOrderDeletable(status: ProductionOrderStatus): boolean {
    return status === "DRAFT"
}

export type ProductionOrderRuleInput = {
    quantity: number
    dueDate?: string | null
    source: ProductionOrderSource
    customerId?: string | null
    cycleTimeOverrideSec?: number | null
}

export type ProductionOrderIssue = {
    field: "quantity" | "dueDate" | "customerId" | "cycleTimeOverrideSec"
    message: string
}

export function findProductionOrderIssues(input: ProductionOrderRuleInput): ProductionOrderIssue[] {
    const issues: ProductionOrderIssue[] = []

    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_PRODUCTION_ORDER_QUANTITY) {
        issues.push({
            field: "quantity",
            message: `Adet 1–${MAX_PRODUCTION_ORDER_QUANTITY.toLocaleString("tr-TR")} arasında tam sayı olmalı.`,
        })
    }
    if (input.dueDate && !isValidDateKey(input.dueDate)) {
        issues.push({ field: "dueDate", message: "Termin tarihi geçersiz." })
    }
    if (input.source === "CUSTOMER_ORDER" && !input.customerId) {
        issues.push({ field: "customerId", message: "Müşteri siparişi için müşteri seçin." })
    }
    if (input.cycleTimeOverrideSec != null && (input.cycleTimeOverrideSec < 0.1 || input.cycleTimeOverrideSec > 3600)) {
        issues.push({ field: "cycleTimeOverrideSec", message: "Elle çevrim 0,1–3600 sn arasında olmalı." })
    }

    return issues
}

export type DueDateTone = "overdue" | "soon" | "ok"

/**
 * Terminin bugüne göre okunuşu ("3 gün kaldı", "2 gün gecikti"). `today` fabrika
 * takviminde bugün ("YYYY-MM-DD"). Termin yoksa `null`.
 */
export function describeProductionOrderDueDate(
    dueDate: string | null,
    today: string,
): { date: string; label: string; tone: DueDateTone; daysLeft: number } | null {
    if (!dueDate || !isValidDateKey(dueDate) || !isValidDateKey(today)) return null

    const daysLeft = daysBetweenDateKeys(today, dueDate)
    const date = formatDateKey(dueDate)
    if (daysLeft < 0) return { date, daysLeft, tone: "overdue", label: `${-daysLeft} gün gecikti` }
    if (daysLeft === 0) return { date, daysLeft, tone: "soon", label: "Bugün" }
    if (daysLeft === 1) return { date, daysLeft, tone: "soon", label: "Yarın" }
    return { date, daysLeft, tone: daysLeft <= 3 ? "soon" : "ok", label: `${daysLeft} gün kaldı` }
}
