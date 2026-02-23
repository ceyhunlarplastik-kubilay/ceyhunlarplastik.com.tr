import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductDependencies, ICreateProductEvent } from "@/functions/AdminApi/types/products"

export const createProductHandler = ({ productRepository, categoryRepository }: IProductDependencies) => {
    return async (event: ICreateProductEvent) => {
        const { code, name, categoryId } = event.body;

        try {
            const category = await categoryRepository.getCategory(categoryId)
            if (!category) throw new createError.NotFound("Category not found");

            if (Number(code.split(".")[0]) !== category.code) {
                throw new createError.BadRequest(`Product code must start with category code ${category.code}`);
            }

            const product = await productRepository.createProduct({
                code,
                name,
                category: { connect: { id: categoryId } },
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { product },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new createError.Conflict("Product code already exists");
            throw new createError.InternalServerError("Failed to create product");
        }
    }
}
