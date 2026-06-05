import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    generateProductAssetUpload,
    generateProductIndustrialUsageImageUpload,
} from "@/core/helpers/s3/presign"

import type { ICreateProductAssetUploadEvent } from "@/functions/AdminApi/types/products"

export const createProductAssetUploadHandler = () => {
    return async (event: ICreateProductAssetUploadEvent) => {

        const { productSlug, assetRole, fileName, contentType, purpose = "PRODUCT_ASSET" } = event.body

        if (!productSlug || !fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields")
        }

        const presigned = purpose === "INDUSTRIAL_USAGE_IMAGE"
            ? await generateProductIndustrialUsageImageUpload({
                productSlug,
                fileName,
                contentType,
            })
            : await generateProductAssetUpload({
                productSlug,
                assetRole: assetRole ?? "GALLERY",
                fileName,
                contentType,
            })

        return apiResponseDTO({
            statusCode: 200,
            payload: presigned,
        })
    }
}
