import {
    assignProductVariantCodes,
    type PlannerSize,
    type PlannerSupplierCode,
    type PlannerVariant,
    type PlannerVersion,
} from "@core/helpers/productVariants/assignProductVariantCodes"
import { buildSizeSignature, buildSizeSortKey } from "@core/helpers/productVariants/sizeSignature"
import { parseVersionCode } from "@core/helpers/productVariants/variantCode"
import { buildVersionSignature } from "@core/helpers/productVariants/versionSignature"

import type {
    MatrixRequirement,
    MatrixRow,
    MatrixSize,
    MatrixSupplierCode,
    MatrixVersion,
    SaveVariantMatrixRowInput,
} from "@/features/admin/productVariantMatrix/api/types"

type ReferenceColor = { id: string; system: string; code: string }
type ReferenceMaterial = { id: string; code: string | null; name: string }

export type VariantCodePreview = {
    /** "10.5.8.V1" — kod hesaplanamadıysa null. */
    fullCode: string | null
    /** "10.5.8.V1.A" — satırda tedarikçi seçilmemişse null. */
    supplierFullCode: string | null
}

const DRAFT_PREFIX = "draft:"

/**
 * Taslak satırların ALACAĞI kodları önceden hesaplar.
 *
 * Kuralı burada YENİDEN YAZMAZ: core'daki `assignProductVariantCodes` planlayıcısı
 * mevcut sözlüklerin üzerine taslak satırlar eklenmiş hâliyle çalıştırılır. Böylece
 * önizleme ile sunucunun ürettiği kod aynı mantıktan gelir.
 *
 * Bu bir TAHMİNDİR: kesin kod kaydetme anında sunucuda üretilir. Aradaki farkın tek
 * kaynağı yarıştır (başka biri aynı anda kaydederse). Taslak modda önizleme mevcut
 * satırların kodlarının da kayabileceğini doğru gösterir, çünkü planlayıcı gerçek
 * kilit durumuyla çalıştırılır.
 */
export function previewVariantCodes(input: {
    productCode: string
    isLocked: boolean
    requirements: MatrixRequirement[]
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    supplierCodes: MatrixSupplierCode[]
    rows: MatrixRow[]
    draftRows: SaveVariantMatrixRowInput[]
    colors: ReferenceColor[]
    materials: ReferenceMaterial[]
}): VariantCodePreview[] {
    const {
        productCode, isLocked, requirements, sizes, versions,
        supplierCodes, rows, draftRows, colors, materials,
    } = input

    if (draftRows.length === 0) return []

    const empty: VariantCodePreview[] = draftRows.map(() => ({ fullCode: null, supplierFullCode: null }))
    if (!productCode || requirements.length === 0) return empty

    const colorById = new Map(colors.map((color) => [color.id, color]))
    const materialById = new Map(materials.map((material) => [material.id, material]))

    const requirementLikes = requirements.map((requirement) => ({
        id: requirement.id,
        measurementCode: requirement.measurementCode,
        label: requirement.label,
        sortPriority: requirement.sortPriority,
        displayOrder: requirement.displayOrder,
    }))

    try {
        // ── Mevcut durum ────────────────────────────────────────────────────────
        const plannerSizes: PlannerSize[] = sizes.map((size) => ({
            id: size.id,
            code: size.code,
            // signature/sortKey matris yanıtında taşınmıyor (istemcinin işine
            // yaramıyordu); değerlerden aynı core yardımcılarıyla yeniden üretilir.
            signature: buildSizeSignature(size.values, requirementLikes),
            sortKey: buildSizeSortKey(size.values, requirementLikes),
        }))
        const sizeIdBySignature = new Map(plannerSizes.map((size) => [size.signature, size.id]))

        const plannerVersions: PlannerVersion[] = versions.map((version) => ({
            id: version.id,
            code: parseVersionCode(version.code),
            signature: buildVersionSignature({ colorId: version.colorId, materialIds: version.materialIds }),
            color: version.colorId ? colorById.get(version.colorId) ?? null : null,
            materials: version.materialIds
                .map((id) => materialById.get(id))
                .filter((material): material is ReferenceMaterial => Boolean(material)),
        }))
        const versionIdBySignature = new Map(plannerVersions.map((version) => [version.signature, version.id]))

        const plannerSupplierCodes: PlannerSupplierCode[] = supplierCodes.map((entry, index) => ({
            id: entry.id,
            supplierId: entry.supplierId,
            code: entry.code,
            sequence: index,
        }))
        const supplierCodeIdBySupplier = new Map(plannerSupplierCodes.map((entry) => [entry.supplierId, entry.id]))

        const plannerVariants: PlannerVariant[] = rows.map((row) => ({
            id: row.variantId,
            sizeId: row.sizeId,
            versionId: row.versionId,
            fullCode: row.fullCode,
            suppliers: row.suppliers.map((supplier) => ({
                id: supplier.id,
                supplierId: supplier.supplierId,
                fullCode: supplier.fullCode,
                supplierCode: supplier.supplierCode,
            })),
        }))
        const variantIdByKey = new Map(plannerVariants.map((v) => [`${v.sizeId}#${v.versionId}`, v.id]))

        // ── Taslak satırları ekle ───────────────────────────────────────────────
        const draftVariantIds: Array<{ variantId: string; supplierRowId: string | null }> = []

        draftRows.forEach((row, index) => {
            const signature = buildSizeSignature(row.measurements, requirementLikes)
            let sizeId = sizeIdBySignature.get(signature)
            if (!sizeId) {
                sizeId = `${DRAFT_PREFIX}size:${signature}`
                sizeIdBySignature.set(signature, sizeId)
                plannerSizes.push({
                    id: sizeId,
                    code: null,
                    signature,
                    sortKey: buildSizeSortKey(row.measurements, requirementLikes),
                })
            }

            const versionSignature = buildVersionSignature({
                colorId: row.colorId ?? null,
                materialIds: row.materialIds ?? [],
            })
            let versionId = versionIdBySignature.get(versionSignature)
            if (!versionId) {
                versionId = `${DRAFT_PREFIX}version:${versionSignature}`
                versionIdBySignature.set(versionSignature, versionId)
                plannerVersions.push({
                    id: versionId,
                    code: null,
                    signature: versionSignature,
                    color: row.colorId ? colorById.get(row.colorId) ?? null : null,
                    materials: (row.materialIds ?? [])
                        .map((id) => materialById.get(id))
                        .filter((material): material is ReferenceMaterial => Boolean(material)),
                })
            }

            if (row.supplier && !supplierCodeIdBySupplier.has(row.supplier.supplierId)) {
                const id = `${DRAFT_PREFIX}supplier:${row.supplier.supplierId}`
                supplierCodeIdBySupplier.set(row.supplier.supplierId, id)
                plannerSupplierCodes.push({
                    id,
                    supplierId: row.supplier.supplierId,
                    code: null,
                    sequence: plannerSupplierCodes.length,
                })
            }

            const variantKey = `${sizeId}#${versionId}`
            let variantId = variantIdByKey.get(variantKey)
            if (!variantId) {
                variantId = `${DRAFT_PREFIX}variant:${index}`
                variantIdByKey.set(variantKey, variantId)
                plannerVariants.push({
                    id: variantId,
                    sizeId,
                    versionId,
                    fullCode: null,
                    suppliers: [],
                })
            }

            let supplierRowId: string | null = null
            if (row.supplier) {
                const variant = plannerVariants.find((entry) => entry.id === variantId)
                const existing = variant?.suppliers.find((s) => s.supplierId === row.supplier!.supplierId)
                if (existing) {
                    supplierRowId = existing.id
                } else if (variant) {
                    supplierRowId = `${DRAFT_PREFIX}vs:${index}`
                    ;(variant.suppliers as PlannerVariant["suppliers"][number][]).push({
                        id: supplierRowId,
                        supplierId: row.supplier.supplierId,
                        fullCode: null,
                        supplierCode: null,
                    })
                }
            }

            draftVariantIds.push({ variantId, supplierRowId })
        })

        const plan = assignProductVariantCodes({
            productCode,
            isLocked,
            sizes: plannerSizes,
            versions: plannerVersions,
            supplierCodes: plannerSupplierCodes,
            variants: plannerVariants,
        })

        const fullCodeByVariant = new Map(plan.variantCodeUpdates.map((u) => [u.id, u.fullCode]))
        const supplierFullCodeById = new Map(plan.variantSupplierCodeUpdates.map((u) => [u.id, u.fullCode]))

        return draftVariantIds.map(({ variantId, supplierRowId }) => {
            // Kodu değişmeyen mevcut varyant plana girmez; o zaman satırdaki kod
            // zaten doğrudur ve mevcut değerinden okunur.
            const fullCode =
                fullCodeByVariant.get(variantId)
                ?? plannerVariants.find((entry) => entry.id === variantId)?.fullCode
                ?? null

            return {
                fullCode,
                supplierFullCode: supplierRowId ? supplierFullCodeById.get(supplierRowId) ?? null : null,
            }
        })
    } catch {
        // Tutarsız girdi (eksik ölçü, bilinmeyen gereksinim) önizlemeyi susturur;
        // satır doğrulaması zaten ayrı çalışıyor.
        return empty
    }
}
