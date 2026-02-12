import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IGetCategoryDependencies, IGetCategoryEvent } from "@/functions/AdminApi/types/categories"

export const getCategoryHandler = ({ categoryRepository }: IGetCategoryDependencies) => {
    return async (event: IGetCategoryEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("Category ID is required");

        try {
            const category = await categoryRepository.getCategory(id);

            if (!category) throw new createError.NotFound("Category not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { category },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err);
            throw new createError.InternalServerError("Failed to get category");
        }
    }
}
