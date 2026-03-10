import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { generateCategoryAssetUpload } from "@/core/helpers/s3/presign"
import type { ICreateCategoryAssetUploadEvent } from "@/functions/AdminApi/types/categories"

export const createCategoryAssetUploadHandler = () => {
    return async (event: ICreateCategoryAssetUploadEvent) => {
        const { categorySlug, assetRole, fileName, contentType } = event.body;

        if (!categorySlug || !assetRole || !fileName || !contentType) throw new createError.BadRequest("Missing required fields");

        const presigned = await generateCategoryAssetUpload({
            categorySlug,
            assetRole,
            fileName,
            contentType,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: presigned, // { uploadUrl, key, url }
        })
    }
}
