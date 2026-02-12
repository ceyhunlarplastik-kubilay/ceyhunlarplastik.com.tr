import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IDeleteCategoryDependencies, IDeleteCategoryEvent } from "@/functions/AdminApi/types/categories"
import { Prisma } from "@/prisma/generated/prisma/client"

export const deleteCategoryHandler = ({ categoryRepository }: IDeleteCategoryDependencies) => {
    return async (event: IDeleteCategoryEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("Category id is required");

        try {
            const category = await categoryRepository.deleteCategory(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { category },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound(`Category not found`);
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete category");
        }
    }
}
