import createError, { HttpError } from "http-errors"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, ICreateProductAttributeValueEvent } from "@/functions/AdminApi/types/productAttributeValues"

const ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const createProductAttributeValueHandler = ({
    productAttributeValueRepository,
    productAttributeRepository,
}: IProductAttributeValueDependencies) => {
    return async (event: ICreateProductAttributeValueEvent) => {
        const { name, attributeId, displayOrder, parentValueId } = event.body

        try {
            const attribute = await productAttributeRepository.getProductAttribute(attributeId)
            if (!attribute) throw new createError.NotFound("Attribute not found")

            let validatedParentValueId: string | null = null

            if (parentValueId) {
                const parentValue = await productAttributeValueRepository.getValueById(parentValueId)
                if (!parentValue) throw new createError.NotFound("Parent value not found")

                if (attribute.code === ATTRIBUTE_CODES.productionGroup && parentValue.attribute.code !== ATTRIBUTE_CODES.sector) {
                    throw new createError.BadRequest("production_group values must be linked to a sector value")
                }

                if (attribute.code === ATTRIBUTE_CODES.usageArea && parentValue.attribute.code !== ATTRIBUTE_CODES.productionGroup) {
                    throw new createError.BadRequest("usage_area values must be linked to a production_group value")
                }

                if (
                    attribute.code !== ATTRIBUTE_CODES.productionGroup &&
                    attribute.code !== ATTRIBUTE_CODES.usageArea
                ) {
                    throw new createError.BadRequest("parentValueId is only supported for production_group and usage_area")
                }

                validatedParentValueId = parentValueId
            } else if (attribute.code === ATTRIBUTE_CODES.productionGroup || attribute.code === ATTRIBUTE_CODES.usageArea) {
                throw new createError.BadRequest(`${attribute.code} value requires parentValueId`)
            }

            const value = await productAttributeValueRepository.createValue({
                name,
                slug: slugify(name, { lower: true, strict: true, locale: "tr" }),
                displayOrder: displayOrder ?? 0,
                attribute: {
                    connect: { id: attributeId }
                },
                ...(validatedParentValueId && {
                    parentValue: {
                        connect: { id: validatedParentValueId }
                    }
                }),
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { value }
            })

        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error);
            throw new createError.InternalServerError("Failed to create value");
        }
    }
}
