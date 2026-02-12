import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateCategoryDependencies, ICreateCategoryEvent } from "@/functions/AdminApi/types/categories"
import { Prisma } from "@/prisma/generated/prisma/client"

export const createCategoryHandler = ({ categoryRepository }: ICreateCategoryDependencies) => {
    return async (event: ICreateCategoryEvent) => {
        const body = event.body

        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least  one field must be provided");

        const allowedFields = ["code", "name"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { code, name } = body;

        try {
            const category = await categoryRepository.createCategory({
                code,
                name,
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { category },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") throw new createError.Conflict(`Category with the code ${code} already exists`)
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create a category");
        }
    }
}
