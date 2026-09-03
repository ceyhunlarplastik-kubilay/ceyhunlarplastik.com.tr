import { randomUUID } from "crypto"
import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { generateCategoryAssetUpload } from "@/core/helpers/s3/presign"
import type {
    ICreateCategoryAssetUploadDependencies,
    ICreateCategoryAssetUploadEvent,
} from "@/functions/AdminApi/types/categories"

export const createCategoryAssetUploadHandler = ({
    assetRepository,
}: ICreateCategoryAssetUploadDependencies) => {
    return async (event: ICreateCategoryAssetUploadEvent) => {
        const { categoryId, categorySlug, assetRole, assetType, fileName, contentType } = event.body;

        if (!categorySlug || !assetRole || !fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields");
        }

        // categoryId + assetType birlikte verilirse presign PENDING_UPLOAD satırını
        // da oluşturur (AssetUploader akışı). Verilmezse yalnız presign döner ve
        // satırı çağıran yazar (CategoryCreateForm — kategori + asset tek-atışta).
        const createsPendingRow = Boolean(categoryId)
        if (createsPendingRow && !assetType) {
            throw new createError.BadRequest("assetType is required when categoryId is provided")
        }

        // Satırın id'si key'in dosya adı olur; S3 ObjectCreated event'i key'den
        // satırı bulup PENDING_UPLOAD → ACTIVE çevirir (confirmCategoryAssetUpload).
        const assetId = randomUUID()

        const presigned = await generateCategoryAssetUpload({
            assetId,
            categorySlug,
            assetRole,
            fileName,
            contentType,
        })

        if (createsPendingRow) {
            try {
                await assetRepository.createPendingAsset({
                    id: assetId,
                    key: presigned.key,
                    mimeType: contentType,
                    type: assetType!,
                    role: assetRole,
                    category: { connect: { id: categoryId! } },
                })
            } catch (err) {
                if (err instanceof HttpError) throw err
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                    throw new createError.NotFound("Category not found")
                }
                throw err
            }
        }

        return apiResponseDTO({
            statusCode: 200,
            payload: { ...presigned, assetId }, // { uploadUrl, key, url, assetId }
        })
    }
}
