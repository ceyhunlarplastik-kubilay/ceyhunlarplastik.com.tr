import createError from "http-errors"
import { prisma } from "@/core/db/prisma"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { deleteS3Objects } from "@/core/helpers/s3/deleteObjects"
import { INDUSTRIAL_ATTRIBUTE_CODES } from "@/core/helpers/products/productIndustrialUsages"
import { AssetRole, Prisma } from "@/prisma/generated/prisma/client"

export type IndustrialUsageAssignmentFilter = "all" | "assigned" | "unassigned"

export type ListIndustrialUsageAssignmentProductsInput = {
    usageAreaValueId: string
    page: number
    limit: number
    search?: string
    assignment: IndustrialUsageAssignmentFilter
}

export type PatchIndustrialUsageAssignmentProductsInput = {
    usageAreaValueId: string
    addProductIds: string[]
    removeProductIds: string[]
}

function mapAttributeValue(value: {
    id: string
    name: string
    slug: string
    parentValueId?: string | null
    displayOrder?: number
    isActive?: boolean
    attribute?: {
        id: string
        code: string
        name: string
    }
}) {
    return {
        id: value.id,
        name: value.name,
        slug: value.slug,
        parentValueId: value.parentValueId ?? null,
        displayOrder: value.displayOrder ?? 0,
        isActive: value.isActive ?? true,
        attribute: value.attribute
            ? {
                id: value.attribute.id,
                code: value.attribute.code,
                name: value.attribute.name,
            }
            : null,
    }
}

async function resolveUsageAreaHierarchy(usageAreaValueId: string) {
    const usageArea = await prisma.productAttributeValue.findUnique({
        where: { id: usageAreaValueId },
        include: {
            attribute: true,
            parentValue: {
                include: {
                    attribute: true,
                    parentValue: {
                        include: {
                            attribute: true,
                        },
                    },
                },
            },
        },
    })

    if (!usageArea || !usageArea.isActive) {
        throw new createError.NotFound("Kullanım alanı bulunamadı")
    }

    if (usageArea.attribute.code !== INDUSTRIAL_ATTRIBUTE_CODES.usageArea) {
        throw new createError.BadRequest("Seçilen değer endüstriyel kullanım alanı değil")
    }

    const productionGroup = usageArea.parentValue
    const sector = productionGroup?.parentValue

    if (
        !productionGroup ||
        !productionGroup.isActive ||
        productionGroup.attribute.code !== INDUSTRIAL_ATTRIBUTE_CODES.productionGroup ||
        !sector ||
        !sector.isActive ||
        sector.attribute.code !== INDUSTRIAL_ATTRIBUTE_CODES.sector
    ) {
        throw new createError.Conflict(
            "Bu kullanım alanının sektör ve üretim grubu bağlantısı eksik. Önce özellik hiyerarşisini düzeltin."
        )
    }

    return {
        usageArea,
        productionGroup,
        sector,
        hierarchy: {
            sector: mapAttributeValue(sector),
            productionGroup: mapAttributeValue(productionGroup),
            usageArea: mapAttributeValue(usageArea),
        },
    }
}

function buildProductSearchWhere(search?: string): Prisma.ProductWhereInput {
    const normalized = search?.trim()
    if (!normalized) return {}

    return {
        OR: [
            { code: { contains: normalized, mode: "insensitive" } },
            { name: { contains: normalized, mode: "insensitive" } },
            { slug: { contains: normalized, mode: "insensitive" } },
        ],
    }
}

function buildAssignmentWhere(
    usageAreaValueId: string,
    assignment: IndustrialUsageAssignmentFilter,
): Prisma.ProductWhereInput {
    if (assignment === "assigned") {
        return {
            industrialUsages: {
                some: { usageAreaValueId },
            },
        }
    }

    if (assignment === "unassigned") {
        return {
            NOT: {
                industrialUsages: {
                    some: { usageAreaValueId },
                },
            },
        }
    }

    return {}
}

async function countDistinctAssignedProducts(usageAreaValueId: string) {
    const rows = await prisma.productIndustrialUsage.findMany({
        where: { usageAreaValueId },
        distinct: ["productId"],
        select: { productId: true },
    })

    return rows.length
}

function naturalCodeCompare(a: string, b: string) {
    return a.localeCompare(b, "tr", {
        numeric: true,
        sensitivity: "base",
    })
}

export async function listIndustrialUsageAssignmentProducts({
    usageAreaValueId,
    page,
    limit,
    search,
    assignment,
}: ListIndustrialUsageAssignmentProductsInput) {
    const { hierarchy } = await resolveUsageAreaHierarchy(usageAreaValueId)

    const safePage = Math.max(1, page)
    const safeLimit = Math.min(Math.max(1, limit), 100)
    const skip = (safePage - 1) * safeLimit

    const where: Prisma.ProductWhereInput = {
        ...buildProductSearchWhere(search),
        ...buildAssignmentWhere(usageAreaValueId, assignment),
    }

    const [allCodes, assignedTotal] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                code: true,
            },
        }),
        countDistinctAssignedProducts(usageAreaValueId),
    ])

    allCodes.sort((left, right) => naturalCodeCompare(left.code, right.code))

    const total = allCodes.length
    const pagedIds = allCodes.slice(skip, skip + safeLimit).map((item) => item.id)
    const totalPages = Math.max(1, Math.ceil(total / safeLimit))

    const products = pagedIds.length
        ? await prisma.product.findMany({
            where: { id: { in: pagedIds } },
            include: {
                category: true,
                assets: true,
                industrialUsages: {
                    where: { usageAreaValueId },
                    select: {
                        id: true,
                        usageAreaValueId: true,
                    },
                },
                _count: {
                    select: {
                        industrialUsages: true,
                    },
                },
            },
        })
        : []

    const orderMap = new Map(pagedIds.map((id, index) => [id, index]))
    const data = products
        .sort(
            (left, right) =>
                (orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
                (orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER),
        )
        .map((product) => {
            const primaryAsset =
                product.assets.find((asset) => asset.role === AssetRole.PRIMARY) ??
                product.assets.find((asset) => asset.type === "IMAGE")

            return {
                id: product.id,
                code: product.code,
                name: product.name,
                slug: product.slug,
                category: product.category
                    ? {
                        id: product.category.id,
                        name: product.category.name,
                        slug: product.category.slug,
                        code: product.category.code,
                    }
                    : null,
                primaryImageUrl: primaryAsset ? buildAssetUrl(primaryAsset.key) : null,
                isAssigned: product.industrialUsages.length > 0,
                assignedUsageId: product.industrialUsages[0]?.id ?? null,
                industrialUsageCount: product._count.industrialUsages,
            }
        })

    return {
        hierarchy,
        assignedTotal,
        data,
        meta: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages,
        },
    }
}

function uniqueIds(ids: string[]) {
    return Array.from(new Set(ids.filter(Boolean)))
}

export async function patchIndustrialUsageAssignmentProducts({
    usageAreaValueId,
    addProductIds,
    removeProductIds,
}: PatchIndustrialUsageAssignmentProductsInput) {
    const { usageArea, productionGroup, sector, hierarchy } =
        await resolveUsageAreaHierarchy(usageAreaValueId)

    const addIds = uniqueIds(addProductIds)
    const removeIds = uniqueIds(removeProductIds)
    const removeIdSet = new Set(removeIds)

    if (addIds.some((id) => removeIdSet.has(id))) {
        throw new createError.BadRequest("Aynı ürün hem ekleme hem çıkarma listesinde olamaz")
    }

    const touchedIds = uniqueIds([...addIds, ...removeIds])

    if (touchedIds.length > 0) {
        const existingProducts = await prisma.product.findMany({
            where: { id: { in: touchedIds } },
            select: { id: true },
        })
        const existingProductIds = new Set(existingProducts.map((product) => product.id))
        const hasMissingProduct = touchedIds.some((id) => !existingProductIds.has(id))

        if (hasMissingProduct) {
            throw new createError.NotFound("Seçilen ürünlerden biri bulunamadı")
        }
    }

    const existingRowsForAdd = addIds.length
        ? await prisma.productIndustrialUsage.findMany({
            where: {
                productId: { in: addIds },
                usageAreaValueId,
            },
            select: {
                productId: true,
            },
        })
        : []

    const alreadyAssignedProductIds = new Set(existingRowsForAdd.map((row) => row.productId))
    const productIdsToCreate = addIds.filter((productId) => !alreadyAssignedProductIds.has(productId))

    const rowsToRemove = removeIds.length
        ? await prisma.productIndustrialUsage.findMany({
            where: {
                productId: { in: removeIds },
                usageAreaValueId,
            },
            select: {
                id: true,
                imageKey: true,
            },
        })
        : []

    const imageKeysToDelete = rowsToRemove
        .map((row) => row.imageKey)
        .filter((key): key is string => Boolean(key))

    if (imageKeysToDelete.length > 0) {
        try {
            await deleteS3Objects(imageKeysToDelete)
        } catch (error) {
            console.error("Industrial usage assignment image cleanup failed:", error)
            throw new createError.InternalServerError("Görsel silinemedi, atama kaldırılamadı")
        }
    }

    const maxDisplayOrders = productIdsToCreate.length
        ? await prisma.productIndustrialUsage.groupBy({
            by: ["productId"],
            where: {
                productId: { in: productIdsToCreate },
            },
            _max: {
                displayOrder: true,
            },
        })
        : []

    const maxDisplayOrderByProductId = new Map(
        maxDisplayOrders.map((row) => [row.productId, row._max.displayOrder ?? -1]),
    )

    await prisma.$transaction(async (tx) => {
        if (rowsToRemove.length > 0) {
            await tx.productIndustrialUsage.deleteMany({
                where: {
                    id: { in: rowsToRemove.map((row) => row.id) },
                },
            })
        }

        if (productIdsToCreate.length > 0) {
            await tx.productIndustrialUsage.createMany({
                data: productIdsToCreate.map((productId) => ({
                    productId,
                    sectorValueId: sector.id,
                    productionGroupValueId: productionGroup.id,
                    usageAreaValueId: usageArea.id,
                    usageFunction: null,
                    imageKey: null,
                    displayOrder: (maxDisplayOrderByProductId.get(productId) ?? -1) + 1,
                })),
            })
        }
    })

    const assignedTotal = await countDistinctAssignedProducts(usageAreaValueId)

    return {
        hierarchy,
        added: productIdsToCreate.length,
        removed: rowsToRemove.length,
        kept: alreadyAssignedProductIds.size,
        assignedTotal,
    }
}
