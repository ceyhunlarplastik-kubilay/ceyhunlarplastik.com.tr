import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeDependencies, ICreateProductAttributeEvent } from "@/functions/AdminApi/types/productAttributes"
import { isSystemCustomerAssignableAttributeCode } from "@/core/helpers/productAttributes/customerAssignableAttributes"
import {
    ProductAttributeTranslationInputError,
    normalizeProductAttributeTranslations,
} from "@/core/helpers/productAttributes/productAttributeTranslations"

export const createProductAttributeHandler = ({ productAttributeRepository }: IProductAttributeDependencies) => {
    return async (event: ICreateProductAttributeEvent) => {
        const { code, name, translations, displayOrder, isCustomerAssignable } = event.body

        try {
            const normalized = normalizeProductAttributeTranslations({
                legacyName: name,
                translations,
                requireTurkish: true,
            })
            const turkish = normalized.turkish!
            const attribute = await productAttributeRepository.createProductAttribute({
                code,
                name: turkish.name,
                displayOrder: displayOrder ?? 0,
                isCustomerAssignable: isSystemCustomerAssignableAttributeCode(code)
                    ? true
                    : isCustomerAssignable ?? false,
                translations: {
                    create: normalized.translations,
                },
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { attribute }
            })
        } catch (err: any) {
            if (err instanceof ProductAttributeTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Attribute code already exists")
            }
            throw new createError.InternalServerError("Failed to create product attribute")
        }
    }
}
