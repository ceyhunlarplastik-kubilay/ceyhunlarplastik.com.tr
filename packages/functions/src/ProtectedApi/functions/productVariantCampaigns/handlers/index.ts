import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreateProductVariantCampaignEvent,
    IDeleteProductVariantCampaignEvent,
    IGetProductVariantCampaignEvent,
    IListProductVariantCampaignsEvent,
    IProductVariantCampaignDependencies,
    IProductVariantCampaignItemBody,
    IUpdateProductVariantCampaignEvent,
} from "@/functions/ProtectedApi/types/productVariantCampaigns"

/** Tarih alanları isteğe bağlı; boş string null sayılır. */
function dateOrNull(value: string | null | undefined) {
    if (value === undefined) return undefined
    if (!value?.trim()) return null
    return new Date(value)
}

function assertValidityRange(validFrom?: Date | null, validUntil?: Date | null) {
    if (validFrom && validUntil && validFrom > validUntil) {
        throw new createError.BadRequest("Kampanya bitiş tarihi başlangıçtan önce olamaz")
    }
}

/**
 * Kalemlerdeki varyantların gerçekten var olduğunu doğrular. Doğrulanmazsa
 * geçersiz kimlik FK ihlali olarak 500'e dönüşür.
 */
async function assertVariantsExist(
    deps: IProductVariantCampaignDependencies,
    items: IProductVariantCampaignItemBody[],
) {
    const uniqueIds = Array.from(new Set(items.map((item) => item.productVariantId)))

    await Promise.all(uniqueIds.map(async (productVariantId) => {
        const variant = await deps.productVariantRepository.getProductVariant(productVariantId)
        if (!variant) {
            throw new createError.NotFound(`Ürün varyantı bulunamadı: ${productVariantId}`)
        }
    }))
}

export const listProductVariantCampaignsHandler = (
    { productVariantCampaignRepository }: IProductVariantCampaignDependencies,
) => {
    return async (event: IListProductVariantCampaignsEvent) => {
        const query = event.queryStringParameters ?? {}

        const result = await productVariantCampaignRepository.listCampaigns({
            page: query.page ? Number(query.page) : undefined,
            limit: query.limit ? Number(query.limit) : undefined,
            search: query.search,
            sort: query.sort,
            order: query.order as "asc" | "desc" | undefined,
            status: query.status,
            productVariantId: query.productVariantId,
            currentOnly: query.currentOnly === "true",
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: result,
        })
    }
}

export const getProductVariantCampaignHandler = (
    { productVariantCampaignRepository }: IProductVariantCampaignDependencies,
) => {
    return async (event: IGetProductVariantCampaignEvent) => {
        const campaign = await productVariantCampaignRepository.getCampaign(event.pathParameters.id)
        if (!campaign) throw new createError.NotFound("Kampanya bulunamadı")

        return apiResponseDTO({ statusCode: 200, payload: { campaign } })
    }
}

export const createProductVariantCampaignHandler = (
    deps: IProductVariantCampaignDependencies,
) => {
    return async (event: ICreateProductVariantCampaignEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const body = event.body
        const validFrom = dateOrNull(body.validFrom) ?? null
        const validUntil = dateOrNull(body.validUntil) ?? null
        assertValidityRange(validFrom, validUntil)

        await assertVariantsExist(deps, body.items)

        const campaign = await deps.productVariantCampaignRepository.createCampaign(
            {
                title: body.title,
                description: body.description ?? null,
                discountPercent: body.discountPercent,
                validFrom,
                validUntil,
                // Varsayılan şemada değil burada: ajv union altındaki default'u
                // uygulayamıyor (bkz. CLAUDE.md tuzakları).
                status: body.status ?? "DRAFT",
                createdByUser: { connect: { id: requester.id } },
            },
            body.items,
        )

        return apiResponseDTO({ statusCode: 201, payload: { campaign } })
    }
}

export const updateProductVariantCampaignHandler = (
    deps: IProductVariantCampaignDependencies,
) => {
    return async (event: IUpdateProductVariantCampaignEvent) => {
        const { id } = event.pathParameters
        const existing = await deps.productVariantCampaignRepository.getCampaign(id)
        if (!existing) throw new createError.NotFound("Kampanya bulunamadı")

        const body = event.body ?? {}
        const validFrom = dateOrNull(body.validFrom)
        const validUntil = dateOrNull(body.validUntil)

        assertValidityRange(
            validFrom === undefined ? existing.validFrom : validFrom,
            validUntil === undefined ? existing.validUntil : validUntil,
        )

        if (body.items) {
            await assertVariantsExist(deps, body.items)
        }

        const campaign = await deps.productVariantCampaignRepository.updateCampaign(
            id,
            {
                ...(body.title !== undefined ? { title: body.title } : {}),
                ...(body.description !== undefined ? { description: body.description ?? null } : {}),
                ...(body.discountPercent !== undefined ? { discountPercent: body.discountPercent } : {}),
                ...(validFrom !== undefined ? { validFrom } : {}),
                ...(validUntil !== undefined ? { validUntil } : {}),
                ...(body.status !== undefined ? { status: body.status } : {}),
            },
            body.items,
        )

        return apiResponseDTO({ statusCode: 200, payload: { campaign } })
    }
}

export const deleteProductVariantCampaignHandler = (
    { productVariantCampaignRepository }: IProductVariantCampaignDependencies,
) => {
    return async (event: IDeleteProductVariantCampaignEvent) => {
        const existing = await productVariantCampaignRepository.getCampaign(event.pathParameters.id)
        if (!existing) throw new createError.NotFound("Kampanya bulunamadı")

        const campaign = await productVariantCampaignRepository.deleteCampaign(event.pathParameters.id)

        return apiResponseDTO({ statusCode: 200, payload: { campaign } })
    }
}
