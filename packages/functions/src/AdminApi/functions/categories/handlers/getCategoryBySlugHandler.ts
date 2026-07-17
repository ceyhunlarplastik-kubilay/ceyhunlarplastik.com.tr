import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IGetCategoryDependencies, IGetCategoryBySlugEvent } from "@/functions/AdminApi/types/categories"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"
import { getSupportedLocale } from "@/core/i18n/locales"

export const getCategoryBySlugHandler = ({ categoryRepository }: IGetCategoryDependencies) => {
    return async (event: IGetCategoryBySlugEvent) => {
        const { slug } = event.pathParameters;
        const locale = getSupportedLocale(event.queryStringParameters?.locale)

        try {
            const category = await categoryRepository.getCategoryBySlug(slug, locale);

            return apiResponseDTO({
                statusCode: 200,
                payload: { category: mapCategoryWithAssets(category) },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Category not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get category");
        }
    }
}
