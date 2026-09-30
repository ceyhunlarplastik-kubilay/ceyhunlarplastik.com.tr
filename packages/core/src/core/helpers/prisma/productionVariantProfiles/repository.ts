import { prisma } from "@/core/db/prisma"
import type { IPaginatedResult } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import {
    inHouseVariantWhere,
    productSizeLabelSelect,
    toProductSizeRef,
    toVariantVersion,
    usableMoldOutputWhere,
    variantVersionSelect,
    type ProductSizeRefDto,
    type VariantVersionDto,
} from "@/core/helpers/prisma/productionReferences/repository"
import { Prisma } from "@/prisma/generated/prisma/client"

/**
 * Üretim varyantları: İÇ ÜRETİM tedarikçisine bağlı katalog varyantları + (varsa) üretim profili.
 * Katalog uçlarının yetkisi genişletilmez; burası yalnız kimlik, ölçü, versiyon ve çevrim taşır.
 */

const productionVariantSelect = {
    id: true,
    fullCode: true,
    product: { select: { id: true, code: true, name: true } },
    size: {
        select: {
            ...productSizeLabelSelect,
            _count: { select: { moldOutputs: { where: usableMoldOutputWhere } } },
        },
    },
    version: { select: variantVersionSelect },
    productionProfile: { select: { cycleTimeSec: true, updatedAt: true } },
} satisfies Prisma.ProductVariantSelect

type ProductionVariantRecord = Prisma.ProductVariantGetPayload<{ select: typeof productionVariantSelect }>

export type ProductionVariantDto = {
    id: string
    fullCode: string
    product: { id: string; code: string; name: string }
    size: ProductSizeRefDto
    version: VariantVersionDto
    /** Ölçüyü basan, kullanım dışı olmayan kalıp sayısı — 0 ise henüz üretilemez. */
    usableMoldCount: number
    /** Varyanta özel çevrim (sn); girilmemişse `null`. */
    cycleTimeSec: number | null
    profileUpdatedAt: Date | null
}

function toDto(record: ProductionVariantRecord): ProductionVariantDto {
    const { _count, ...size } = record.size
    return {
        id: record.id,
        fullCode: record.fullCode,
        product: record.product,
        size: toProductSizeRef(record.product.code, size),
        version: toVariantVersion(record.version),
        usableMoldCount: _count.moldOutputs,
        cycleTimeSec: record.productionProfile?.cycleTimeSec ?? null,
        profileUpdatedAt: record.productionProfile?.updatedAt ?? null,
    }
}

export type ProductionVariantListQuery = { page: number; limit: number; search?: string }

export interface IPrismaProductionVariantProfileRepository {
    listVariants(query: ProductionVariantListQuery): Promise<IPaginatedResult<ProductionVariantDto>>
    /** Yalnız iç üretim varyantı döner; değilse `null`. */
    getVariant(variantId: string): Promise<ProductionVariantDto | null>
    setCycleTime(variantId: string, cycleTimeSec: number | null): Promise<ProductionVariantDto>
}

export const productionVariantProfileRepository = (): IPrismaProductionVariantProfileRepository => {
    const listVariants = async ({ page, limit, search }: ProductionVariantListQuery) => {
        const needle = search?.trim()
        const where: Prisma.ProductVariantWhereInput = {
            ...inHouseVariantWhere,
            ...(needle
                ? {
                    OR: [
                        { fullCode: { contains: needle, mode: "insensitive" } },
                        { product: { name: { contains: needle, mode: "insensitive" } } },
                    ],
                }
                : {}),
        }
        const [total, records] = await Promise.all([
            prisma.productVariant.count({ where }),
            prisma.productVariant.findMany({
                where,
                // Ölçü KODU sıralı değil — küçükten büyüğe sıra `sortKey` ile (AGENTS.md).
                orderBy: [{ product: { code: "asc" } }, { size: { sortKey: "asc" } }, { version: { code: "asc" } }],
                skip: (page - 1) * limit,
                take: limit,
                select: productionVariantSelect,
            }),
        ])
        return buildPaginationResponse(records.map(toDto), {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        })
    }

    const getVariant = async (variantId: string) => {
        const record = await prisma.productVariant.findFirst({
            where: { id: variantId, ...inHouseVariantWhere },
            select: productionVariantSelect,
        })
        return record ? toDto(record) : null
    }

    const setCycleTime = async (variantId: string, cycleTimeSec: number | null) => {
        await prisma.productionVariantProfile.upsert({
            where: { variantId },
            create: { variantId, cycleTimeSec },
            update: { cycleTimeSec },
        })
        const variant = await getVariant(variantId)
        if (!variant) throw new Error(`Variant ${variantId} disappeared after profile upsert`)
        return variant
    }

    return { listVariants, getVariant, setCycleTime }
}
