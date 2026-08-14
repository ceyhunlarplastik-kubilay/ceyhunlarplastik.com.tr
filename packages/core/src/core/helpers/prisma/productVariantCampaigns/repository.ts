import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type {
    Prisma,
    ProductVariantCampaign,
    ProductVariantCampaignStatus,
} from "@/prisma/generated/prisma/client"

const userSummarySelect = {
    id: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
    groups: true,
} as const

/**
 * Kampanya kalemleri varyantın kart görünümü için gereken kadarını taşır.
 * Tedarikçi/fiyat ağacı BİLİNÇLİ olarak dışarıda: portal listesi yüzlerce kalem
 * dönebiliyor ve o ağaç Lambda yanıtını şişiriyor (bkz. mapProductWithAssets
 * daraltması).
 */
const campaignItemVariantInclude = {
    productVariant: {
        include: {
            color: true,
            materials: true,
            assets: true,
            measurements: {
                orderBy: [
                    { measurementType: { displayOrder: "asc" } },
                    { measurementType: { code: "asc" } },
                    { value: "asc" },
                    { label: "asc" },
                ],
                include: {
                    measurementType: true,
                },
            },
            product: {
                include: {
                    category: true,
                    assets: true,
                },
            },
        },
    },
} satisfies Prisma.ProductVariantCampaignItemInclude

const campaignInclude = {
    createdByUser: {
        select: userSummarySelect,
    },
    items: {
        orderBy: { displayOrder: "asc" },
        include: campaignItemVariantInclude,
    },
} satisfies Prisma.ProductVariantCampaignInclude

export type ProductVariantCampaignWithRelations = Prisma.ProductVariantCampaignGetPayload<{
    include: typeof campaignInclude
}>

export type ProductVariantCampaignListQuery = IPaginationQuery & {
    status?: ProductVariantCampaignStatus
    productVariantId?: string
    /** Yalnız bugün geçerli olanlar (validFrom/validUntil penceresi). */
    currentOnly?: boolean
}

export type ProductVariantCampaignItemInput = {
    productVariantId: string
    discountPercent?: number | null
}

export interface IPrismaProductVariantCampaignRepository {
    listCampaigns(query: ProductVariantCampaignListQuery): Promise<{
        data: ProductVariantCampaignWithRelations[]
        meta: { page: number; limit: number; total: number; totalPages: number }
    }>
    /** Portal yüzeyi: yalnız ACTIVE ve tarih penceresi içinde olanlar. */
    listActiveCampaigns(now?: Date): Promise<ProductVariantCampaignWithRelations[]>
    getCampaign(id: string): Promise<ProductVariantCampaignWithRelations | null>
    createCampaign(
        data: Omit<Prisma.ProductVariantCampaignCreateInput, "items">,
        items: ProductVariantCampaignItemInput[],
    ): Promise<ProductVariantCampaignWithRelations>
    updateCampaign(
        id: string,
        data: Prisma.ProductVariantCampaignUpdateInput,
        items?: ProductVariantCampaignItemInput[],
    ): Promise<ProductVariantCampaignWithRelations>
    deleteCampaign(id: string): Promise<ProductVariantCampaignWithRelations>
}

/** Tarih penceresi: uç değerler null ise sınırsız sayılır. */
function currentValidityWhere(now: Date): Prisma.ProductVariantCampaignWhereInput {
    return {
        AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
    }
}

function toItemCreateData(items: ProductVariantCampaignItemInput[]) {
    // Aynı varyant iki kez gelirse unique kısıt patlar; girişte tekilleştiriyoruz.
    const seen = new Set<string>()

    return items
        .filter((item) => {
            if (!item.productVariantId || seen.has(item.productVariantId)) return false
            seen.add(item.productVariantId)
            return true
        })
        .map((item, index) => ({
            productVariantId: item.productVariantId,
            discountPercent: item.discountPercent ?? null,
            displayOrder: index,
        }))
}

export const productVariantCampaignRepository = (): IPrismaProductVariantCampaignRepository => {
    const getCampaign = async (id: string) =>
        prisma.productVariantCampaign.findUnique({
            where: { id },
            include: campaignInclude,
        })

    const listCampaigns = async (query: ProductVariantCampaignListQuery) => {
        const { where, orderBy, skip, take, page, limit } =
            buildPaginationQuery<ProductVariantCampaign>(query, {
                searchableFields: ["title", "description"],
                defaultSort: "createdAt",
            })

        const finalWhere: Prisma.ProductVariantCampaignWhereInput = {
            ...where,
            ...(query.status ? { status: query.status } : {}),
            ...(query.currentOnly ? currentValidityWhere(new Date()) : {}),
            ...(query.productVariantId
                ? { items: { some: { productVariantId: query.productVariantId } } }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.productVariantCampaign.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: campaignInclude,
            }),
            prisma.productVariantCampaign.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listActiveCampaigns = async (now = new Date()) =>
        prisma.productVariantCampaign.findMany({
            where: {
                status: "ACTIVE",
                ...currentValidityWhere(now),
            },
            orderBy: { createdAt: "desc" },
            include: campaignInclude,
        })

    const createCampaign = async (
        data: Omit<Prisma.ProductVariantCampaignCreateInput, "items">,
        items: ProductVariantCampaignItemInput[],
    ) => {
        const created = await prisma.productVariantCampaign.create({
            data: {
                ...data,
                items: { create: toItemCreateData(items) },
            },
            include: campaignInclude,
        })

        return created
    }

    const updateCampaign = async (
        id: string,
        data: Prisma.ProductVariantCampaignUpdateInput,
        items?: ProductVariantCampaignItemInput[],
    ) => {
        // Kalem listesi gönderilmediyse dokunulmaz; gönderildiyse tam değişim
        // (özel fiyatların aksine kalemlerin bağımsız bir yaşam döngüsü yok).
        await prisma.$transaction(async (tx) => {
            await tx.productVariantCampaign.update({ where: { id }, data })

            if (items) {
                await tx.productVariantCampaignItem.deleteMany({ where: { campaignId: id } })

                const itemData = toItemCreateData(items)
                if (itemData.length > 0) {
                    await tx.productVariantCampaignItem.createMany({
                        data: itemData.map((item) => ({ ...item, campaignId: id })),
                    })
                }
            }
        })

        const campaign = await getCampaign(id)
        if (!campaign) throw new Error("Campaign not found after update")
        return campaign
    }

    const deleteCampaign = async (id: string) =>
        prisma.productVariantCampaign.delete({
            where: { id },
            include: campaignInclude,
        })

    return {
        listCampaigns,
        listActiveCampaigns,
        getCampaign,
        createCampaign,
        updateCampaign,
        deleteCampaign,
    }
}
