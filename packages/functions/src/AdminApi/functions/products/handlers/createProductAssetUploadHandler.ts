import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    generateProductAssetUpload,
    generateProductIndustrialUsageImageUpload,
} from "@/core/helpers/s3/presign"

import type { ICreateProductAssetUploadEvent } from "@/functions/AdminApi/types/products"

export const createProductAssetUploadHandler = () => {
    return async (event: ICreateProductAssetUploadEvent) => {

        const { productSlug, assetRole, fileName, contentType, purpose = "PRODUCT_ASSET", locale } = event.body

        if (!productSlug || !fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields")
        }

        if (purpose === "PRODUCT_ASSET" && assetRole === "MODEL_3D") {
            if (!fileName.toLowerCase().endsWith(".glb") || contentType !== "model/gltf-binary") {
                throw new createError.BadRequest("MODEL_3D uploads require a model/gltf-binary .glb file")
            }
        }

        const presigned = purpose === "INDUSTRIAL_USAGE_IMAGE"
            ? await generateProductIndustrialUsageImageUpload({
                productSlug,
                fileName,
                contentType,
                locale,
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
