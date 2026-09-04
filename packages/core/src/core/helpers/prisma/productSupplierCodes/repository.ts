import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { deleteS3Object } from "@/core/helpers/s3/deleteObject"
import { nextSupplierCode, parseSupplierCode } from "@/core/helpers/productVariants/variantCode"

/**
 * Ürün modeli başına tedarikçi harfi sözlüğü — kodun 5. segmenti ("A").
 *
 * Harf ÜRÜN MODELİNE ÖZELDİR: `1.2.3.V1.A` Özgen'i gösterirken `10.11.2.V1.A`
 * Aparat Toptan'ı gösterebilir. Şema bunu zaten destekliyordu
 * (`@@unique([productId, code])`); eksik olan, harfleri ELLE belirleyebilmekti —
 * öncesinde ilk kullanım sırasına göre otomatik veriliyordu.
 *
 * HARF ile TEDARİKÇİ ayrı şeylerdir (versiyon sözlüğündeki numara/kombinasyon
 * ayrımının aynısı):
 *  - **Harf değiştirilemez.** `fullCode` (`10.11.2.V1.A`) harfi içerir; değiştirmek
 *    o tedarikçinin tüm varyant-tedarikçi satırlarının kodunu yeniden yazmayı
 *    gerektirir.
 *  - **Tedarikçi ataması düzenlenebilir.** Kodun içinde tedarikçi KİMLİĞİ geçmez,
 *    yalnız harf geçer — yani veri girişindeki seçim hatası kodları bozmadan
 *    düzeltilebilir.
 *
 * Düzenlemenin kalan riski anlamsaldır: dışarı çıkmış bir katalogda A artık başka
 * bir firmayı gösterir. Arayüz kullanımdaki bir harfi düzenlerken uyarır.
 */

/**
 * Ürün modeli + tedarikçi harfi başına TEK teknik resim. `PENDING_UPLOAD` iken
 * arayüz "İşleniyor" rozeti gösterir; S3 ObjectCreated onayı `ACTIVE` yapar.
 */
export type SupplierCodeDrawingView = {
    id: string
    key: string
    url: string
    mimeType: string
    uploadStatus: "PENDING_UPLOAD" | "ACTIVE"
    uploadedAt: Date | null
    createdAt: Date
}

export type ProductSupplierCodeRow = {
    id: string
    code: string
    supplierId: string
    supplier: { id: string; name: string }
    /** Bu üründe kaç varyant-tedarikçi satırı bu harfi kullanıyor. */
    usageCount: number
    /** En güncel teknik resim (varsa); yoksa null. */
    technicalDrawing: SupplierCodeDrawingView | null
    createdAt: Date
}

export interface IPrismaProductSupplierCodeRepository {
    list(productId: string): Promise<ProductSupplierCodeRow[]>
    create(input: {
        productId: string
        supplierId: string
        /** Verilmezse ürün içindeki sıradaki harf atanır. */
        code?: string
    }): Promise<ProductSupplierCodeRow>
    /** Harf DEĞİŞMEZ; yalnız hangi tedarikçiye ait olduğu düzenlenir. */
    update(input: {
        productId: string
        id: string
        supplierId: string
    }): Promise<ProductSupplierCodeRow>
    remove(input: { productId: string; id: string }): Promise<{ id: string }>
}

const rowSelect = {
    id: true,
    code: true,
    supplierId: true,
    createdAt: true,
    supplier: { select: { id: true, name: true } },
    // Ürün modeli + harf başına TEK teknik resim. Normalde 0-1 satır olur
    // (değiştirme = eskiyi sil + yeniyi yükle); yarıda kalmış bir PENDING
    // eski ACTIVE'i gizlemesin diye birkaç satır çekip ACTIVE'i tercih ediyoruz.
    assets: {
        where: { type: "TECHNICAL_DRAWING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true,
            key: true,
            mimeType: true,
            uploadStatus: true,
            uploadedAt: true,
            createdAt: true,
        },
    },
} as const

type RawRow = {
    id: string
    code: string
    supplierId: string
    createdAt: Date
    supplier: { id: string; name: string }
    assets: Array<{
        id: string
        key: string
        mimeType: string
        uploadStatus: "PENDING_UPLOAD" | "ACTIVE"
        uploadedAt: Date | null
        createdAt: Date
    }>
}

/**
 * Harflerin kullanım sayıları — ürünün TÜMÜ için TEK sorguda.
 *
 * Satır başına ayrı `count` atmak N+1 üretiyordu. `ProductVariantSupplier` harfi
 * kendi üzerinde snapshot olarak da taşır ama doğru kaynak tedarikçi bağıdır.
 *
 * DİKKAT: bu bir TRANSACTION DIŞI okumadır ve öyle kalmalı. Global `prisma`
 * istemcisiyle yapılan bir sorguyu `$transaction` callback'i İÇİNDE çağırmak
 * transaction'ın bağlantısını kullanmaz, ayrı bir bağlantı açar; Neon'da o el
 * sıkışma 5 sn'lik interaktif transaction sınırını aşıp P2028 veriyordu (yaşandı,
 * kubi 2026-08-26). Kullanım sayısı bir GÖSTERİM alanıdır — yazmayla aynı
 * transaction'da olması gerekmiyor.
 */
async function loadUsageCounts(productId: string): Promise<Map<string, number>> {
    const grouped = await prisma.productVariantSupplier.groupBy({
        by: ["supplierId"],
        where: { variant: { productId } },
        _count: { _all: true },
    })

    return new Map(grouped.map((entry) => [entry.supplierId, entry._count._all]))
}

function toRow(raw: RawRow, usageCount: number): ProductSupplierCodeRow {
    const drawingRow =
        raw.assets.find((asset) => asset.uploadStatus === "ACTIVE") ?? raw.assets[0] ?? null

    return {
        id: raw.id,
        code: raw.code,
        supplierId: raw.supplierId,
        supplier: raw.supplier,
        usageCount,
        technicalDrawing: drawingRow
            ? {
                id: drawingRow.id,
                key: drawingRow.key,
                url: buildAssetUrl(drawingRow.key),
                mimeType: drawingRow.mimeType,
                uploadStatus: drawingRow.uploadStatus,
                uploadedAt: drawingRow.uploadedAt,
                createdAt: drawingRow.createdAt,
            }
            : null,
        createdAt: raw.createdAt,
    }
}

export const productSupplierCodeRepository = (): IPrismaProductSupplierCodeRepository => {
    const list = async (productId: string) => {
        const [rows, usage] = await Promise.all([
            prisma.productSupplierCode.findMany({
                where: { productId },
                orderBy: { code: "asc" },
                select: rowSelect,
            }),
            loadUsageCounts(productId),
        ])

        return rows.map((row) => toRow(row, usage.get(row.supplierId) ?? 0))
    }

    const create = async (input: { productId: string; supplierId: string; code?: string }) => {
        // Transaction YALNIZ tekillik kontrolü + yazma içerir. Gösterim için
        // gereken kullanım sayısı commit'ten SONRA okunur — bkz. loadUsageCounts.
        const created = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: input.productId },
                select: { id: true },
            })
            if (!product) throw new createError.NotFound("Ürün bulunamadı")

            // İki kontrol TEK sorgudan: "bu tedarikçinin harfi var mı" ve
            // "bu harf başkasına ait mi". Ayrı sorgular gidiş-dönüşü artırıyordu
            // ve yüksek gecikmeli bağlantıda transaction süresi kritik.
            const assigned = await tx.productSupplierCode.findMany({
                where: { productId: input.productId },
                select: { code: true, supplierId: true },
            })

            const existingForSupplier = assigned.find((entry) => entry.supplierId === input.supplierId)
            if (existingForSupplier) {
                throw new createError.Conflict(
                    `Bu tedarikçinin bu üründe zaten harfi var: ${existingForSupplier.code}`,
                )
            }

            const assignedCodes = assigned.map((entry) => entry.code)

            let code = input.code?.trim().toUpperCase()
            if (code) {
                if (parseSupplierCode(code) === null) {
                    throw new createError.BadRequest(`Geçersiz harf: ${code}`)
                }
                if (assignedCodes.includes(code)) {
                    throw new createError.Conflict(`${code} harfi bu üründe başka bir tedarikçiye ait.`)
                }
            } else {
                code = nextSupplierCode(assignedCodes)
            }

            return tx.productSupplierCode.create({
                data: { productId: input.productId, supplierId: input.supplierId, code },
                select: rowSelect,
            })
        })

        // Yeni harfin kullanımı zorunlu olarak 0 — sorgu bile gerekmiyor.
        return toRow(created, 0)
    }

    const update = async (input: { productId: string; id: string; supplierId: string }) => {
        const updated = await prisma.$transaction(async (tx) => {
            const existing = await tx.productSupplierCode.findUnique({
                where: { id: input.id },
                select: { id: true, code: true, productId: true, supplierId: true },
            })
            // productId eşleşmesi yetki sınırıdır: başka ürünün kaydı düzenlenemez.
            if (!existing || existing.productId !== input.productId) {
                throw new createError.NotFound("Tedarikçi harfi bulunamadı")
            }

            if (existing.supplierId !== input.supplierId) {
                const clash = await tx.productSupplierCode.findUnique({
                    where: { productId_supplierId: { productId: input.productId, supplierId: input.supplierId } },
                    select: { code: true },
                })
                if (clash) {
                    throw new createError.Conflict(
                        `Bu tedarikçinin bu üründe zaten harfi var: ${clash.code}`,
                    )
                }
            }


            return tx.productSupplierCode.update({
                where: { id: input.id },
                // `code` BİLİNÇLİ olarak yazılmıyor — harf değişmez.
                data: { supplierId: input.supplierId },
                select: rowSelect,
            })
        })

        const usage = await loadUsageCounts(input.productId)
        return toRow(updated, usage.get(updated.supplierId) ?? 0)
    }

    const remove = async (input: { productId: string; id: string }) => {
        const existing = await prisma.productSupplierCode.findUnique({
            where: { id: input.id },
            select: { id: true, code: true, productId: true, supplierId: true },
        })
        if (!existing || existing.productId !== input.productId) {
            throw new createError.NotFound("Tedarikçi harfi bulunamadı")
        }

        const usage = (await loadUsageCounts(input.productId)).get(existing.supplierId) ?? 0
        if (usage > 0) {
            throw new createError.Conflict(
                `${existing.code} silinemez — ${usage} varyant satırı bu tedarikçiyi kullanıyor.`,
            )
        }

        // Asset satırları FK cascade ile gider; S3 nesnelerini önce elle temizle
        // ki bucket'ta çöp kalmasın (deleteAssetHandler ile aynı sıra).
        const drawings = await prisma.asset.findMany({
            where: { productSupplierCodeId: input.id, type: "TECHNICAL_DRAWING" },
            select: { key: true },
        })
        for (const drawing of drawings) {
            await deleteS3Object(drawing.key)
        }

        await prisma.productSupplierCode.delete({ where: { id: input.id } })
        return { id: input.id }
    }

    return { list, create, update, remove }
}
