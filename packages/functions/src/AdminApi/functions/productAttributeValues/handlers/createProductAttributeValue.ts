import createError from "http-errors"
import slugify from "slugify"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeValueDependencies, ICreateProductAttributeValueEvent } from "@/functions/AdminApi/types/productAttributeValues"

export const createProductAttributeValueHandler = ({ productAttributeValueRepository }: IProductAttributeValueDependencies) => {
    return async (event: ICreateProductAttributeValueEvent) => {
        const { name, attributeId, displayOrder } = event.body

        try {
            const value = await productAttributeValueRepository.createValue({
                name,
                slug: slugify(name, { lower: true, strict: true, locale: "tr" }),
                displayOrder: displayOrder ?? 0,
                attribute: {
                    connect: { id: attributeId }
                }
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { value }
            })

        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to create value");
        }
    }
}
