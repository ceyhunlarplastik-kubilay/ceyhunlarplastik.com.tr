import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { generateProductAssetUpload } from "@/core/helpers/s3/presign"

import type { ICreateProductAssetUploadEvent } from "@/functions/AdminApi/types/products"

export const createProductAssetUploadHandler = () => {
    return async (event: ICreateProductAssetUploadEvent) => {

        const { productSlug, assetRole, fileName, contentType } = event.body

        if (!productSlug || !assetRole || !fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields")
        }

        const presigned = await generateProductAssetUpload({
            productSlug,
            assetRole,
            fileName,
            contentType,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: presigned,
        })
    }
}