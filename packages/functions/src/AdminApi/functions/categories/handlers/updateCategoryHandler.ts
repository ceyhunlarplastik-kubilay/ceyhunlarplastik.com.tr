import { Prisma } from "@/prisma/generated/prisma/client"
import createError, { HttpError } from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IUpdateCategoryDependencies, IUpdateCategoryEvent } from "@/functions/AdminApi/types/categories"

export const updateCategoryHandler = ({ categoryRepository }: IUpdateCategoryDependencies) => {
    return async (event: IUpdateCategoryEvent) => {
        const id = event.pathParameters?.id;
        const body = event.body;

        if (!id) throw new createError.BadRequest("Category ID is required");
        if (!body || Object.keys(body).length === 0) throw new createError.BadRequest("At least  one field must be provided");

        const allowedFields = ["name"] as const
        const invalidFields = Object.keys(body).filter(
            key => !allowedFields.includes(key as any)
        )

        if (invalidFields.length > 0) throw new createError.BadRequest(`Invalid fields provided: ${invalidFields.join(", ")}`)

        const { name } = body;
        // Object Spread
        const updateData: Prisma.CategoryUpdateInput = {
            ...(name !== undefined ? { name } : {}),
            // ...(name !== undefined && { name }),
        }

        try {
            const category = await categoryRepository.updateCategory(id, updateData);

            return apiResponse({
                statusCode: 200,
                payload: { category },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Category not found")
                else if (err.code === "P2002") throw new createError.Conflict("Category with the same code already exist")
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update the category");
        }
    }
}
