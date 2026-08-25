import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { buildVersionSignature } from "@/core/helpers/productVariants/versionSignature"

/**
 * Ürün modeli başına versiyon sözlüğü — renk + hammadde kombinasyonunun kodun
 * 4. segmentindeki numarası ("V1"). Her ürün modelinin kendi listesi vardır ve
 * numara APPEND-ONLY'dur.
 *
 * Bu yüzey sözlüğü ÖNDEN tanımlamak içindir: veri girişine başlamadan "10.5
 * içinde Siyah + Bakalit = V1" denebilsin. `productVariantWriter` tanımsız bir
 * kombinasyonu OTOMATİK EKLEMEZ, satırı reddeder — kod ataması bilinçli bir karar.
 *
 * KOD ile KOMBİNASYON ayrı şeylerdir:
 *  - **Kod (V1) değiştirilemez.** `fullCode` = `10.5.8.V1` — numarayı değiştirmek
 *    o versiyonu kullanan tüm varyantların kodunu yeniden yazmayı gerektirir.
 *  - **Kombinasyon (renk + hammadde) düzenlenebilir.** Kodun içinde renk/hammadde
 *    GEÇMEZ, yani düzenleme hiçbir `fullCode`'u değiştirmez; yalnız `signature`
 *    yeniden hesaplanır. Veri girişinde yapılan seçim hatası (ör. fazladan
 *    hammadde) böylece varyantları silmeden düzeltilebilir.
 *
 * Düzenlemenin kalan riski yapısal değil ANLAMSALDIR: dışarı çıkmış bir katalogda
 * V1 artık başka bir kombinasyonu gösterir. Bu yüzden arayüz, kullanımdaki bir
 * versiyon düzenlenirken kaç varyantı etkilediğini söyleyip onay ister.
 */

export type VariantVersionRow = {
    id: string
    code: number
    colorId: string | null
    color: { id: string; name: string; code: string; system: string; hex: string } | null
    materials: Array<{ id: string; name: string; code: string | null }>
    /** Kaç varyant bu kombinasyonu kullanıyor — silinebilirliği belirler. */
    variantCount: number
    createdAt: Date
}

export interface IPrismaVariantVersionRepository {
    list(productId: string): Promise<VariantVersionRow[]>
    create(input: {
        productId: string
        colorId: string | null
        materialIds: string[]
        /** Verilmezse ürün içindeki sıradaki boş numara atanır. */
        code?: number
    }): Promise<VariantVersionRow>
    /**
     * Kombinasyonu değiştirir. Kod DEĞİŞMEZ — bkz. modül başlığı.
     * Yeni kombinasyon o üründe zaten tanımlıysa 409.
     */
    update(input: {
        productId: string
        id: string
        colorId: string | null
        materialIds: string[]
    }): Promise<VariantVersionRow>
    remove(input: { productId: string; id: string }): Promise<{ id: string }>
}

const rowSelect = {
    id: true,
    code: true,
    colorId: true,
    createdAt: true,
    color: { select: { id: true, name: true, code: true, system: true, hex: true } },
    materials: { select: { id: true, name: true, code: true } },
    _count: { select: { variants: true } },
} as const

function toRow(entry: {
    id: string
    code: number
    colorId: string | null
    createdAt: Date
    color: { id: string; name: string; code: string; system: string; hex: string } | null
    materials: Array<{ id: string; name: string; code: string | null }>
    _count: { variants: number }
}): VariantVersionRow {
    return {
        id: entry.id,
        code: entry.code,
        colorId: entry.colorId,
        color: entry.color,
        materials: entry.materials,
        variantCount: entry._count.variants,
        createdAt: entry.createdAt,
    }
}

export const variantVersionRepository = (): IPrismaVariantVersionRepository => {
    const list = async (productId: string) => {
        const rows = await prisma.variantVersion.findMany({
            where: { productId },
            orderBy: { code: "asc" },
            select: rowSelect,
        })
        return rows.map(toRow)
    }

    const create = async (input: {
        productId: string
        colorId: string | null
        materialIds: string[]
        code?: number
    }) => {
        const materialIds = [...new Set(input.materialIds)]
        const signature = buildVersionSignature({ colorId: input.colorId, materialIds })

        return prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: input.productId },
                select: { id: true },
            })
            if (!product) throw new createError.NotFound("Ürün bulunamadı")

            const existing = await tx.variantVersion.findUnique({
                where: { productId_signature: { productId: input.productId, signature } },
                select: { code: true },
            })
            if (existing) {
                throw new createError.Conflict(
                    `Bu renk ve hammadde kombinasyonu bu üründe zaten tanımlı: V${existing.code}`,
                )
            }

            let code = input.code
            if (code === undefined) {
                const highest = await tx.variantVersion.aggregate({
                    where: { productId: input.productId },
                    _max: { code: true },
                })
                code = (highest._max.code ?? 0) + 1
            } else {
                const taken = await tx.variantVersion.findUnique({
                    where: { productId_code: { productId: input.productId, code } },
                    select: { id: true },
                })
                if (taken) {
                    throw new createError.Conflict(
                        `V${code} numarası bu üründe başka bir kombinasyona ait.`,
                    )
                }
            }

            const created = await tx.variantVersion.create({
                data: {
                    productId: input.productId,
                    code,
                    signature,
                    ...(input.colorId ? { colorId: input.colorId } : {}),
                    ...(materialIds.length > 0 ? { materials: { connect: materialIds.map((id) => ({ id })) } } : {}),
                },
                select: rowSelect,
            })

            return toRow(created)
        })
    }

    const update = async (input: {
        productId: string
        id: string
        colorId: string | null
        materialIds: string[]
    }) => {
        const materialIds = [...new Set(input.materialIds)]
        const signature = buildVersionSignature({ colorId: input.colorId, materialIds })

        return prisma.$transaction(async (tx) => {
            const existing = await tx.variantVersion.findUnique({
                where: { id: input.id },
                select: { id: true, code: true, productId: true, signature: true },
            })
            // productId eşleşmesi yetki sınırıdır: başka ürünün kaydı bu uçtan düzenlenemez.
            if (!existing || existing.productId !== input.productId) {
                throw new createError.NotFound("Versiyon bulunamadı")
            }

            if (existing.signature !== signature) {
                const clash = await tx.variantVersion.findUnique({
                    where: { productId_signature: { productId: input.productId, signature } },
                    select: { code: true },
                })
                if (clash) {
                    throw new createError.Conflict(
                        `Bu renk ve hammadde kombinasyonu bu üründe zaten tanımlı: V${clash.code}`,
                    )
                }
            }

            const updated = await tx.variantVersion.update({
                where: { id: input.id },
                data: {
                    signature,
                    // `set` şart: connect yalnız EKLER, kaldırılan hammadde bağlı kalırdı.
                    colorId: input.colorId,
                    materials: { set: materialIds.map((id) => ({ id })) },
                },
                select: rowSelect,
            })

            return toRow(updated)
        })
    }

    const remove = async (input: { productId: string; id: string }) => {
        const existing = await prisma.variantVersion.findUnique({
            where: { id: input.id },
            select: { id: true, code: true, productId: true, _count: { select: { variants: true } } },
        })
        // productId eşleşmesi yetki sınırıdır: başka bir ürünün kaydı bu uçtan silinemez.
        if (!existing || existing.productId !== input.productId) {
            throw new createError.NotFound("Versiyon bulunamadı")
        }

        // Kullanımdaki bir kombinasyon silinemez: numarası varyant kodlarında geçiyor.
        if (existing._count.variants > 0) {
            throw new createError.Conflict(
                `V${existing.code} silinemez — ${existing._count.variants} varyant bu kombinasyonu kullanıyor.`,
            )
        }

        await prisma.variantVersion.delete({ where: { id: input.id } })
        return { id: input.id }
    }

    return { list, create, update, remove }
}
