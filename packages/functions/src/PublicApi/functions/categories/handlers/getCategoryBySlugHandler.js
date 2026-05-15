import createError from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets";
export const getCategoryBySlugHandler = ({ categoryRepository }) => {
    return async (event) => {
        const { slug } = event.pathParameters;
        try {
            const category = await categoryRepository.getCategoryBySlug(slug);
            return apiResponseDTO({
                statusCode: 200,
                payload: { category: mapCategoryWithAssets(category) },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Category not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get category");
        }
    };
};
