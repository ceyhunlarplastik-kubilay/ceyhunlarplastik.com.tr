import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeDependencies, ICreateProductAttributeEvent } from "@/functions/AdminApi/types/productAttributes"

export const createProductAttributeHandler = ({ productAttributeRepository }: IProductAttributeDependencies) => {
    return async (event: ICreateProductAttributeEvent) => {
        const { code, name, displayOrder } = event.body

        try {
            const attribute = await productAttributeRepository.createProductAttribute({
                code,
                name,
                displayOrder: displayOrder ?? 0,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { attribute }
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new createError.Conflict("Attribute code already exists");
            throw new createError.InternalServerError("Failed to create product attribute");
        }
    }
}
