import {
    assignProductVariantCodes,
    type PlannerSize,
    type PlannerSupplierCode,
    type PlannerVariant,
    type PlannerVersion,
} from "@core/helpers/productVariants/assignProductVariantCodes"
import { buildRequiredSignature, buildSizeSortKey } from "@core/helpers/productVariants/sizeSignature"
import { parseVersionCode } from "@core/helpers/productVariants/variantCode"
import { buildVersionSignature } from "@core/helpers/productVariants/versionSignature"

import type {
    MatrixRequirement,
    MatrixRow,
    MatrixSize,
    MatrixSupplierCode,
    MatrixVersion,
    SaveVariantMatrixRowInput,
    VariantVersionDictionaryEntry,
} from "@/features/admin/productVariantMatrix/api/types"

export type VariantCodePreview = {
    /** "10.5.8.V1" — kod hesaplanamadıysa null. */
    fullCode: string | null
    /** "10.5.8.V1.A" — satırda tedarikçi seçilmemişse null. */
    supplierFullCode: string | null
    /**
     * Satırdaki renk + hammadde kombinasyonu ürünün sözlüğünde TANIMLI mı?
     * Tanımsızsa kod üretilemez ve satır kaydedilemez — sunucu da reddeder.
     */
    versionDefined: boolean
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
 *
 * Versiyon numarası burada UYDURULMAZ: sözlükte tanımlı olmayan bir renk + hammadde
 * kombinasyonu `versionDefined: false` ile işaretlenir ve kod üretilmez. Sunucu da
 * aynı satırı reddeder, yani önizleme ile kayıt sonucu ayrışmaz.
 */
export function previewVariantCodes(input: {
    productCode: string
    requirements: MatrixRequirement[]
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    supplierCodes: MatrixSupplierCode[]
    rows: MatrixRow[]
    draftRows: SaveVariantMatrixRowInput[]
    /** Ürün modelinin TANIMLI sözlüğü — henüz kullanılmayan kombinasyonlar dahil. */
    versionDictionary: VariantVersionDictionaryEntry[]
}): VariantCodePreview[] {
    const {
        productCode, requirements, sizes, versions,
        supplierCodes, rows, draftRows, versionDictionary,
    } = input

    if (draftRows.length === 0) return []

    const empty: VariantCodePreview[] = draftRows.map(() => ({
        fullCode: null,
        supplierFullCode: null,
        versionDefined: true,
    }))
    if (!productCode || requirements.length === 0) return empty

    // Ürünün sözlüğü imzalarıyla aranır: henüz hiçbir varyantta kullanılmamış ama
    // TANIMLI olan bir kombinasyon "tanımsız" sanılmamalı.
    const dictionaryBySignature = new Map(
        versionDictionary.map((entry) => [
            buildVersionSignature({ colorId: entry.colorId, materialIds: entry.materialIds }),
            entry,
        ]),
    )

    const requirementLikes = requirements.map((requirement) => ({
        id: requirement.id,
        measurementCode: requirement.measurementCode,
        label: requirement.label,
        sortPriority: requirement.sortPriority,
        displayOrder: requirement.displayOrder,
        isRequired: requirement.isRequired,
    }))

    try {
        // ── Mevcut durum ────────────────────────────────────────────────────────
        const plannerSizes: PlannerSize[] = sizes.map((size) => ({
            id: size.id,
            code: size.code,
            // signature/sortKey matris yanıtında taşınmıyor (istemcinin işine
            // yaramıyordu); değerlerden aynı core yardımcılarıyla yeniden üretilir.
            // signature = ZORUNLU ölçü imzası (sunucudaki productVariantWriter ile aynı).
            signature: buildRequiredSignature(size.values, requirementLikes),
            sortKey: buildSizeSortKey(size.values, requirementLikes),
        }))
        const sizeIdBySignature = new Map(plannerSizes.map((size) => [size.signature, size.id]))

        const plannerVersions: PlannerVersion[] = versions.map((version) => ({
            id: version.id,
            code: parseVersionCode(version.code) ?? 0,
        }))
        const versionIdBySignature = new Map(
            versions.map((version) => [
                buildVersionSignature({ colorId: version.colorId, materialIds: version.materialIds }),
                version.id,
            ]),
        )

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
        const draftVariantIds: Array<{
            variantId: string | null
            supplierRowId: string | null
            versionDefined: boolean
        }> = []

        draftRows.forEach((row, index) => {
            const signature = buildRequiredSignature(row.measurements, requirementLikes)
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
                // ÖNCE TANIMLANMALI: sözlükte yoksa numara uydurulmaz, satır
                // kodsuz kalır ve kaydetme engellenir.
                const known = dictionaryBySignature.get(versionSignature)
                if (!known) {
                    draftVariantIds.push({ variantId: null, supplierRowId: null, versionDefined: false })
                    return
                }
                versionId = known.id
                versionIdBySignature.set(versionSignature, versionId)
                plannerVersions.push({ id: versionId, code: known.code })
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

            draftVariantIds.push({ variantId, supplierRowId, versionDefined: true })
        })

        const plan = assignProductVariantCodes({
            productCode,
            sizes: plannerSizes,
            versions: plannerVersions,
            supplierCodes: plannerSupplierCodes,
            variants: plannerVariants,
        })

        const fullCodeByVariant = new Map(plan.variantCodeUpdates.map((u) => [u.id, u.fullCode]))
        const supplierFullCodeById = new Map(plan.variantSupplierCodeUpdates.map((u) => [u.id, u.fullCode]))

        return draftVariantIds.map(({ variantId, supplierRowId, versionDefined }) => {
            if (!versionDefined || !variantId) {
                return { fullCode: null, supplierFullCode: null, versionDefined: false }
            }

            // Kodu değişmeyen mevcut varyant plana girmez; o zaman satırdaki kod
            // zaten doğrudur ve mevcut değerinden okunur.
            const fullCode =
                fullCodeByVariant.get(variantId)
                ?? plannerVariants.find((entry) => entry.id === variantId)?.fullCode
                ?? null

            return {
                fullCode,
                supplierFullCode: supplierRowId ? supplierFullCodeById.get(supplierRowId) ?? null : null,
                versionDefined: true,
            }
        })
    } catch {
        // Tutarsız girdi (eksik ölçü, bilinmeyen gereksinim) önizlemeyi susturur;
        // satır doğrulaması zaten ayrı çalışıyor.
        return empty
    }
}
