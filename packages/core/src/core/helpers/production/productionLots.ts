/**
 * Üretim LOTLARI — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 *  - Lot numarası "kök-sıra" (1000-2): saklanmaz, işin kökü + sıradan türer. Taşımada lotlar
 *    sıraya göre yerinde güncellendiği için numara (ve notu, ekibi) kalıcıdır (`jobPlan.ts`).
 *  - Lotun ekibi: lota özel satır varsa o; yoksa vardiya ekibinden (makine × vardiya günü ×
 *    vardiya kodu). İş tamamlanırken ekip lota kopyalanır — sonradan ekip değişse de istatistik
 *    bozulmaz.
 *  - Notu planlayıcı yazar (operatör hesabı yok); bir operatör adına girilebilir. Notu yalnız
 *    yazanı ya da admin / owner siler.
 */
import { formatLotNumber } from "./jobPlan"

export { formatLotNumber }

/** "1000-2" — kök en çok 9, sıra en çok 4 hane. İstek validator'ı da bunu kullanır. */
export const LOT_NUMBER_PATTERN = /^(\d{1,9})-(\d{1,4})$/

export function parseLotNumber(value: string): { lotBaseNumber: number; sequence: number } | null {
    const match = LOT_NUMBER_PATTERN.exec(value.trim())
    if (!match) return null
    const lotBaseNumber = Number(match[1])
    const sequence = Number(match[2])
    return sequence >= 1 ? { lotBaseNumber, sequence } : null
}

// ---- Notlar ----

export type ProductionLotNoteCategory = "GENERAL" | "QUALITY" | "MAINTENANCE" | "MATERIAL" | "HANDOVER"

export const LOT_NOTE_CATEGORIES: ProductionLotNoteCategory[] = ["GENERAL", "QUALITY", "MAINTENANCE", "MATERIAL", "HANDOVER"]

export const LOT_NOTE_CATEGORY_LABELS: Record<ProductionLotNoteCategory, string> = {
    GENERAL: "Genel",
    QUALITY: "Kalite",
    MAINTENANCE: "Bakım / arıza",
    MATERIAL: "Hammadde",
    HANDOVER: "Vardiya devri",
}

export const MAX_LOT_NOTE_LENGTH = 2000

/** Kırpılmış metin boşsa ya da sınırı aşıyorsa Türkçe mesaj, geçerliyse `null`. */
export function findLotNoteIssue(body: string): string | null {
    const trimmed = body.trim()
    if (!trimmed) return "Not boş olamaz."
    if (trimmed.length > MAX_LOT_NOTE_LENGTH) return `Not en fazla ${MAX_LOT_NOTE_LENGTH.toLocaleString("tr-TR")} karakter olabilir.`
    return null
}

export function canDeleteLotNote(
    note: { authorUserId: string | null },
    viewer: { id: string | null | undefined; isAdmin: boolean; isOwner: boolean },
): boolean {
    if (viewer.isAdmin || viewer.isOwner) return true
    return Boolean(viewer.id) && note.authorUserId === viewer.id
}

// ---- Lotun ekibi ----

export const MAX_OPERATORS_PER_LOT = 10

/** `lot` = lota özel / dondurulmuş; `roster` = vardiya ekibinden; `none` = kimse atanmamış. */
export type LotOperatorSource = "lot" | "roster" | "none"

export function resolveLotOperators<T>(lotOperators: T[], rosterOperators: T[]): { source: LotOperatorSource; operators: T[] } {
    if (lotOperators.length > 0) return { source: "lot", operators: lotOperators }
    if (rosterOperators.length > 0) return { source: "roster", operators: rosterOperators }
    return { source: "none", operators: [] }
}

/**
 * İş tamamlanırken dondurulacak lot ekipleri: lota özel satırı OLMAYAN her lot için o makinenin
 * o vardiya günü + kodundaki ekip. Makine süzgecini çağıran uygular (atamalar o makinenin).
 */
export function buildLotOperatorSnapshot(input: {
    lots: Array<{ id: string; shiftDate: string; shiftCode: string; lotOperatorCount: number }>
    assignments: Array<{ shiftDate: string; shiftCode: string; operatorId: string }>
}): Array<{ lotId: string; operatorId: string }> {
    const rows: Array<{ lotId: string; operatorId: string }> = []
    for (const lot of input.lots) {
        if (lot.lotOperatorCount > 0) continue
        const operatorIds = new Set(input.assignments
            .filter((assignment) => assignment.shiftDate === lot.shiftDate && assignment.shiftCode === lot.shiftCode)
            .map((assignment) => assignment.operatorId))
        for (const operatorId of operatorIds) rows.push({ lotId: lot.id, operatorId })
    }
    return rows
}
