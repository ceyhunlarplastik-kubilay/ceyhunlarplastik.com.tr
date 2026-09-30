/**
 * Zorunlu ölçü imzası (`buildRequiredSignature`) aynı olan `ProductSize` kayıtlarını
 * TEK kayıtta birleştirir.
 *
 * Neden gerekli: eski sistemde ölçüler "tüm dolu değerler + tedarikçi" anahtarıyla
 * tekilleşiyordu; Sanay/Özgen/Esersan aynı zorunlu ölçüyü girince üç ayrı
 * `ProductSize` (1.23.1 / 1.23.2 / 1.23.3) oluşuyordu. Yeni kural zorunlu ölçüleri
 * eşleşenleri aynı koda toplar. Bu yardımcı, kural değişmeden önce yazılmış veriyi
 * o hâle getirir.
 *
 * Yalnız TEK SEFERLİK backfill script'inden çağrılır — `recalculateProductVariantCodes`
 * BİLEREK çağırmaz: sipariş/talep referansı olan bir varyantı sessizce yok etmemek
 * için otomatik birleştirme yapılmaz.
 *
 * GÜVENLİ: bir kopya ölçünün varyantlarından herhangi biri sipariş/talep/özel
 * fiyat/kampanya/müşteri ataması/asset ile ilişkiliyse ve keeper'da aynı versiyon
 * zaten varsa, o kopya ölçü DOKUNULMADAN bırakılır (kısmi birleştirme) ve uyarı
 * loglanır. Çağıran bir transaction içinde olmalıdır.
 *
 * Kopyanın kalıp gözleri (`MoldOutput`, üretim planlama) keeper'a taşınır: ölçüyü
 * `Restrict` ile tuttukları için taşınmasalar kopyanın silinmesi FK hatasıyla düşerdi.
 */

import { prisma } from "@/core/db/prisma"
import {
    buildRequiredSignature,
    buildSizeSortKey,
    type MeasurementRequirementLike,
} from "./sizeSignature"

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type MergeProductSizesResult = {
    mergedSizes: number
    movedVariants: number
    movedSupplierLinks: number
    movedMoldOutputs: number
    skippedSizes: number
}

async function variantHasExternalReferences(tx: TransactionClient, variantId: string): Promise<boolean> {
    const [orderItems, requestItems, specialPrices, assignments, campaignItems, assets] = await Promise.all([
        tx.orderItem.count({ where: { productVariantId: variantId } }),
        tx.businessRequestItem.count({ where: { productVariantId: variantId } }),
        tx.customerVariantSpecialPrice.count({ where: { productVariantId: variantId } }),
        tx.customerAssignedProduct.count({ where: { productVariantId: variantId } }),
        tx.productVariantCampaignItem.count({ where: { productVariantId: variantId } }),
        tx.asset.count({ where: { variantId } }),
    ])
    return orderItems + requestItems + specialPrices + assignments + campaignItems + assets > 0
}

/**
 * Kopya ölçünün kalıp gözlerini keeper'a taşır. Aynı kalıbın keeper'da da gözü varsa
 * iki kayıt aslında AYNI ölçünün gözleridir: göz sayıları toplanır, kopya satır silinir
 * (`@@unique([moldId, productSizeId])` iki satıra izin vermez).
 */
async function moveMoldOutputsToKeeper(
    tx: TransactionClient,
    duplicateSizeId: string,
    keeperSizeId: string,
): Promise<number> {
    const outputs = await tx.moldOutput.findMany({
        where: { productSizeId: duplicateSizeId },
        select: { id: true, moldId: true, cavities: true },
    })
    if (outputs.length === 0) return 0

    const keeperOutputs = await tx.moldOutput.findMany({
        where: { productSizeId: keeperSizeId, moldId: { in: outputs.map((output) => output.moldId) } },
        select: { id: true, moldId: true, cavities: true },
    })
    const keeperOutputByMold = new Map(keeperOutputs.map((output) => [output.moldId, output]))

    for (const output of outputs) {
        const keeperOutput = keeperOutputByMold.get(output.moldId)
        if (keeperOutput) {
            await tx.moldOutput.update({
                where: { id: keeperOutput.id },
                data: { cavities: keeperOutput.cavities + output.cavities },
            })
            await tx.moldOutput.delete({ where: { id: output.id } })
            continue
        }
        await tx.moldOutput.update({
            where: { id: output.id },
            data: { productSizeId: keeperSizeId },
        })
    }

    return outputs.length
}

export async function mergeProductSizesByRequiredSignature(
    tx: TransactionClient,
    productId: string,
): Promise<MergeProductSizesResult> {
    const empty: MergeProductSizesResult = {
        mergedSizes: 0,
        movedVariants: 0,
        movedSupplierLinks: 0,
        movedMoldOutputs: 0,
        skippedSizes: 0,
    }

    const requirementRows = await tx.productMeasurementRequirement.findMany({
        where: { productId },
        include: { measurementType: { select: { code: true } } },
    })
    if (requirementRows.length === 0) return empty

    const requirements: MeasurementRequirementLike[] = requirementRows.map((requirement) => ({
        id: requirement.id,
        measurementCode: requirement.measurementType.code,
        label: requirement.label,
        sortPriority: requirement.sortPriority,
        displayOrder: requirement.displayOrder,
        isRequired: requirement.isRequired,
    }))

    const sizes = await tx.productSize.findMany({
        where: { productId },
        orderBy: { code: "asc" },
        select: {
            id: true,
            code: true,
            values: { select: { requirementId: true, value: true } },
            variants: {
                select: {
                    id: true,
                    variantVersionId: true,
                    variantSuppliers: { select: { id: true, supplierId: true } },
                },
            },
        },
    })

    const groups = new Map<string, typeof sizes>()
    for (const size of sizes) {
        if (size.values.length === 0) continue
        const signature = buildRequiredSignature(size.values, requirements)
        const bucket = groups.get(signature) ?? []
        bucket.push(size)
        groups.set(signature, bucket)
    }

    const result = { ...empty }

    for (const bucket of groups.values()) {
        if (bucket.length < 2) continue

        // `orderBy: code asc` → ilk kayıt en küçük kodludur, keeper odur.
        const [keeper, ...duplicates] = bucket
        const keeperValueReqIds = new Set(keeper.values.map((value) => value.requirementId))
        const keeperVariantIdByVersion = new Map(
            keeper.variants.map((variant) => [variant.variantVersionId, variant.id]),
        )

        for (const duplicate of duplicates) {
            // Keeper'da AYNI versiyon varyantı olan ve dışarıdan referanslı bir
            // varyant içeren kopya ölçüye dokunmayız — kısmi birleştirme.
            let blocked = false
            for (const variant of duplicate.variants) {
                if (!keeperVariantIdByVersion.has(variant.variantVersionId)) continue
                if (await variantHasExternalReferences(tx, variant.id)) {
                    blocked = true
                    break
                }
            }
            if (blocked) {
                console.warn(
                    `[mergeProductSizes] product ${productId}: kopya ölçü ${duplicate.id} dışarıdan referanslı, atlandı`,
                )
                result.skippedSizes += 1
                continue
            }

            // 1) Kopyanın (özellikle opsiyonel) ölçü değerlerini keeper'a taşı.
            for (const value of duplicate.values) {
                if (keeperValueReqIds.has(value.requirementId)) continue
                await tx.productSizeValue.create({
                    data: {
                        productSizeId: keeper.id,
                        requirementId: value.requirementId,
                        value: value.value,
                    },
                })
                keeperValueReqIds.add(value.requirementId)
            }

            // 2) Varyantları taşı.
            for (const variant of duplicate.variants) {
                const keeperVariantId = keeperVariantIdByVersion.get(variant.variantVersionId)

                if (!keeperVariantId) {
                    await tx.productVariant.update({
                        where: { id: variant.id },
                        data: { productSizeId: keeper.id },
                    })
                    keeperVariantIdByVersion.set(variant.variantVersionId, variant.id)
                    result.movedVariants += 1
                    continue
                }

                const keeperSupplierIds = new Set(
                    (
                        await tx.productVariantSupplier.findMany({
                            where: { variantId: keeperVariantId },
                            select: { supplierId: true },
                        })
                    ).map((link) => link.supplierId),
                )

                for (const link of variant.variantSuppliers) {
                    if (keeperSupplierIds.has(link.supplierId)) {
                        // Keeper'da bu tedarikçi zaten var — kopya linki at.
                        await tx.productVariantSupplier.delete({ where: { id: link.id } })
                        continue
                    }
                    await tx.productVariantSupplier.update({
                        where: { id: link.id },
                        data: { variantId: keeperVariantId },
                    })
                    keeperSupplierIds.add(link.supplierId)
                    result.movedSupplierLinks += 1
                }

                await tx.productVariant.delete({ where: { id: variant.id } })
            }

            // 3) Kalıp gözlerini keeper'a taşı — yoksa silme `Restrict` FK'sine takılır.
            result.movedMoldOutputs += await moveMoldOutputsToKeeper(tx, duplicate.id, keeper.id)

            await tx.productSize.delete({ where: { id: duplicate.id } })
            result.mergedSizes += 1
        }

        // 4) Keeper'ın imza/sortKey'ini birleşmiş değerlere göre tazele.
        const refreshed = await tx.productSize.findUnique({
            where: { id: keeper.id },
            select: { values: { select: { requirementId: true, value: true } } },
        })
        if (refreshed && refreshed.values.length > 0) {
            await tx.productSize.update({
                where: { id: keeper.id },
                data: {
                    signature: buildRequiredSignature(refreshed.values, requirements),
                    sortKey: buildSizeSortKey(refreshed.values, requirements),
                },
            })
        }
    }

    return result
}
