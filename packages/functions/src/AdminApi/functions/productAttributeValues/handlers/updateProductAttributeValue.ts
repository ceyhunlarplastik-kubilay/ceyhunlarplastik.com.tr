import createError, { HttpError } from "http-errors"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, IUpdateProductAttributeValueEvent } from "@/functions/AdminApi/types/productAttributeValues"

const ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const updateProductAttributeValueHandler = ({
    productAttributeValueRepository,
    assetRepository,
}: IProductAttributeValueDependencies) => {
    return async (event: IUpdateProductAttributeValueEvent) => {
        const { id } = event.pathParameters
        const body = event.body

        try {
            const current = await productAttributeValueRepository.getValueById(id)
            if (!current) throw new createError.NotFound("Value not found")

            const hasParentValueInput = Object.prototype.hasOwnProperty.call(body, "parentValueId")
            const requestedParentValueId = body.parentValueId

            if (hasParentValueInput) {
                if (requestedParentValueId) {
                    const parentValue = await productAttributeValueRepository.getValueById(requestedParentValueId)
                    if (!parentValue) throw new createError.NotFound("Parent value not found")

                    if (current.attribute.code === ATTRIBUTE_CODES.productionGroup && parentValue.attribute.code !== ATTRIBUTE_CODES.sector) {
                        throw new createError.BadRequest("production_group values must be linked to a sector value")
                    }

                    if (current.attribute.code === ATTRIBUTE_CODES.usageArea && parentValue.attribute.code !== ATTRIBUTE_CODES.productionGroup) {
                        throw new createError.BadRequest("usage_area values must be linked to a production_group value")
                    }

                    if (
                        current.attribute.code !== ATTRIBUTE_CODES.productionGroup &&
                        current.attribute.code !== ATTRIBUTE_CODES.usageArea
                    ) {
                        throw new createError.BadRequest("parentValueId is only supported for production_group and usage_area")
                    }
                } else if (
                    requestedParentValueId === null &&
                    (current.attribute.code === ATTRIBUTE_CODES.productionGroup || current.attribute.code === ATTRIBUTE_CODES.usageArea)
                ) {
                    throw new createError.BadRequest(`${current.attribute.code} value requires parentValueId`)
                }
            }

            const value = await productAttributeValueRepository.updateValue(id, {
                ...(body.name && {
                    name: body.name,
                    slug: slugify(body.name, { lower: true, strict: true, locale: "tr" }),
                }),
                ...(body.displayOrder !== undefined && {
                    displayOrder: body.displayOrder,
                }),
                ...(hasParentValueInput && {
                    parentValue: requestedParentValueId
                        ? { connect: { id: requestedParentValueId } }
                        : { disconnect: true }
                }),
            })

            const { assetType, assetRole, assetKey, mimeType } = body
            if (assetType && assetKey && mimeType) {
                if ((assetRole ?? "PRIMARY") === "PRIMARY") {
                    await assetRepository.unsetProductAttributeValuePrimaryAssets(id)
                }

                await assetRepository.createAsset({
                    key: assetKey,
                    mimeType,
                    type: assetType,
                    role: assetRole ?? "PRIMARY",
                    productAttributeValueId: id,
                } as any)
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: { value }
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error);
            throw new createError.InternalServerError("Failed to update value");
        }
    }
}
