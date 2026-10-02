import type { MatrixRow, MatrixRowSupplier, MatrixSize } from "@/features/admin/productVariantMatrix/api/types"
import {
    createEmptyDraftRow,
    type VariantMatrixDraftRow,
} from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"
import {
    draftCommercialFieldsFromSupplier,
    draftMeasurementsFromSize,
} from "@/features/admin/productVariantMatrix/utils/buildDraftFromRow"

/** Kopyalanan taslakların tedarikçisi. */
export type BulkCopySupplierMode =
    /** Satırın AKTİF her tedarikçi bağlantısı ayrı taslak; aktif bağlantısı yoksa tedarikçisiz. */
    | { kind: "rowSuppliers" }
    /** Hepsi sözlükteki tek bir tedarikçiyle. */
    | { kind: "supplier"; supplierId: string }
    | { kind: "none" }

export type BulkCopyOptions = {
    /** Her hedef versiyon için ayrı kopya: V2 + V3 seçilirse taslak sayısı iki katı. */
    targetVersionIds: readonly string[]
    supplierMode: BulkCopySupplierMode
    /** Aynı tedarikçinin fiyat / MOQ / logo / koli / termin bilgisi taşınsın mı. */
    copyCommercial: boolean
}

export type BulkCopyResult = {
    drafts: VariantMatrixDraftRow[]
    /**
     * Aynı ölçü + versiyon + tedarikçi zaten KAYITLI. Kaydetmek yeni varyant açmaz,
     * yalnız mevcut tedarikçi bağlantısının fiyatının üzerine yazardı.
     */
    skippedExisting: number
    /** Aynısı zaten taslakta ya da bu kopyada ikinci kez üretilecekti. */
    skippedDuplicate: number
}

type SupplierTarget = { supplierId: string | null; link?: MatrixRowSupplier }

function resolveSupplierTargets(row: MatrixRow, mode: BulkCopySupplierMode): SupplierTarget[] {
    switch (mode.kind) {
        case "none":
            return [{ supplierId: null }]
        case "supplier":
            return [{ supplierId: mode.supplierId, link: row.suppliers.find((s) => s.supplierId === mode.supplierId) }]
        case "rowSuppliers": {
            // Pasif bağlantı = o tedarikçi bu varyantı artık satmıyor; yeni versiyona taşınmaz.
            const active = row.suppliers.filter((supplier) => supplier.isActive)
            return active.length > 0
                ? active.map((link) => ({ supplierId: link.supplierId, link }))
                : [{ supplierId: null }]
        }
    }
}

/**
 * Taslağın kimliği: dolu ölçü metinleri + versiyon + tedarikçi. Aynı kopyayı iki kez
 * basmayı engeller; metin karşılaştırmasıdır (kopyalanan taslaklar kayıttaki metni taşır).
 */
export function draftIdentityKey(draft: VariantMatrixDraftRow): string {
    const measurements = Object.entries(draft.measurements)
        .map(([requirementId, value]) => [requirementId, value.trim()] as const)
        .filter(([, value]) => value !== "")
        .sort(([left], [right]) => left.localeCompare(right))
    return JSON.stringify([measurements, draft.versionId ?? "", draft.supplierId ?? ""])
}

/**
 * Seçili kayıtlı satırları hedef versiyon(lar)a TASLAK olarak kopyalar.
 *
 * Tipik iş: "10 ölçünün V1'i kayıtlı, aynı ölçüleri V2 için de gir". Ölçüler birebir
 * taşınır (bileşik değer dahil); kod sunucuda verilir. Ölçü sunucuda yalnız ZORUNLU ölçü
 * imzasıyla eşleştiği için (tedarikçi anahtara girmez) kopya aynı ölçü kodunu kullanır.
 *
 * Atlananlar:
 * - Aynı ölçü + versiyon + tedarikçi zaten kayıtlı. Tedarikçisiz kopyada varyantın
 *   kendisinin kayıtlı olması yeter.
 * - Aynısı zaten taslakta ya da bu kopyada ikinci kez üretilecek (ör. aynı ölçünün V1 ve V3
 *   satırları birlikte seçilip V2'ye kopyalanırsa V2 bir kez).
 *
 * Tedarikçinin kendi ürün kodu (`supplierVariantCode`) kopyalanmaz: renge / versiyona
 * özgüdür, taşınsaydı iki farklı varyant aynı tedarikçi koduyla görünürdü.
 *
 * Sıra: önce versiyon, sonra satır (tablodaki sırayla), sonra tedarikçi.
 */
export function buildDraftsFromSelection(input: {
    /** Tablodaki sırayla. */
    selectedRows: readonly MatrixRow[]
    /** Ürünün TÜM kayıtlı satırları — filtre ve sayfadan bağımsız. */
    allRows: readonly MatrixRow[]
    sizes: readonly MatrixSize[]
    currentDrafts: readonly VariantMatrixDraftRow[]
    options: BulkCopyOptions
}): BulkCopyResult {
    const { selectedRows, allRows, sizes, currentDrafts, options } = input

    const sizeById = new Map(sizes.map((size) => [size.id, size]))
    const rowBySizeVersion = new Map(allRows.map((row) => [`${row.sizeId}#${row.versionId}`, row]))
    const existingDraftKeys = new Set(currentDrafts.map(draftIdentityKey))
    const batchKeys = new Set<string>()

    const drafts: VariantMatrixDraftRow[] = []
    let skippedExisting = 0
    let skippedDuplicate = 0

    for (const versionId of options.targetVersionIds) {
        for (const row of selectedRows) {
            const measurements = draftMeasurementsFromSize(sizeById.get(row.sizeId))

            for (const target of resolveSupplierTargets(row, options.supplierMode)) {
                const registered = rowBySizeVersion.get(`${row.sizeId}#${versionId}`)
                const alreadyRegistered = Boolean(registered) && (
                    target.supplierId === null
                    || Boolean(registered?.suppliers.some((supplier) => supplier.supplierId === target.supplierId))
                )
                if (alreadyRegistered) {
                    skippedExisting += 1
                    continue
                }

                const draft = createEmptyDraftRow({
                    measurements: { ...measurements },
                    versionId,
                    supplierId: target.supplierId ?? undefined,
                    ...(options.copyCommercial && target.link ? draftCommercialFieldsFromSupplier(target.link) : {}),
                })

                const batchKey = `${row.sizeId}#${versionId}#${target.supplierId ?? ""}`
                if (batchKeys.has(batchKey) || existingDraftKeys.has(draftIdentityKey(draft))) {
                    skippedDuplicate += 1
                    continue
                }

                batchKeys.add(batchKey)
                drafts.push(draft)
            }
        }
    }

    return { drafts, skippedExisting, skippedDuplicate }
}

/**
 * Sabitlenmiş versiyon / tedarikçiyi taslaklara uygular. Sabitleme satırdaki seçimi
 * kilitlediği için TÜM taslaklar sabit değeri taşımalı — aksi halde farklı değerdeki bir
 * taslak sabitleme kaldırılana kadar değiştirilemezdi.
 */
export function applyDraftPins(
    drafts: readonly VariantMatrixDraftRow[],
    pins: { versionId?: string; supplierId?: string },
): VariantMatrixDraftRow[] {
    if (!pins.versionId && !pins.supplierId) return [...drafts]

    return drafts.map((draft) => ({
        ...draft,
        ...(pins.versionId ? { versionId: pins.versionId } : {}),
        ...(pins.supplierId ? { supplierId: pins.supplierId } : {}),
    }))
}
