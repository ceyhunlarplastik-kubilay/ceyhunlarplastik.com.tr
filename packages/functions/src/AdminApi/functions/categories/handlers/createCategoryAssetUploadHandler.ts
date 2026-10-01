import { randomUUID } from "crypto"
import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { generateCategoryAssetUpload } from "@/core/helpers/s3/presign"
import { isAllowedCategoryAssetContentType } from "@/core/helpers/assets/categoryAssetContentTypes"
import type {
    ICreateCategoryAssetUploadDependencies,
    ICreateCategoryAssetUploadEvent,
} from "@/functions/AdminApi/types/categories"

/**
 * Kategori görseli eklemenin TEK yolu. Anahtarı ve PENDING_UPLOAD satırını sunucu birlikte
 * üretir; istemci yalnız dosyayı imzalı adrese yükler, S3 ObjectCreated olayı satırı ACTIVE'e
 * çevirir (confirmCategoryAssetUpload). İstemcinin bildirdiği bir anahtar hiçbir yerde
 * kaydedilmez — eskiden `POST /categories` istemciden gelen `assetKey`'i doğrulamadan ACTIVE
 * satır olarak yazıyordu (başka kaydın dosyası bağlanabiliyor, var olmayan dosya görünüyordu).
 */
export const createCategoryAssetUploadHandler = ({
    categoryRepository,
    assetRepository,
}: ICreateCategoryAssetUploadDependencies) => {
    return async (event: ICreateCategoryAssetUploadEvent) => {
        const { categoryId, assetRole, assetType, fileName, contentType } = event.body ?? {}

        if (!categoryId || !assetRole || !assetType || !fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields");
        }

        // İmzaya giren tip CDN'den o tiple servis edilir: yalnız izin listesi ve asset tipine uyan.
        if (!isAllowedCategoryAssetContentType(assetType, contentType)) {
            throw new createError.BadRequest(`Content type ${contentType} is not allowed for ${assetType}`)
        }

        try {
            // Klasör istemcinin söylediği slug'dan değil, kategorinin kaydından gelir.
            const category = await categoryRepository.getCategory(categoryId)

            // Satırın id'si key'in dosya adı olur; S3 olayı key'den satırı bulur.
            const assetId = randomUUID()

            const presigned = await generateCategoryAssetUpload({
                assetId,
                categorySlug: category.slug,
                assetRole,
                fileName,
                contentType,
            })

            await assetRepository.createPendingAsset({
                id: assetId,
                key: presigned.key,
                mimeType: contentType,
                type: assetType,
                role: assetRole,
                category: { connect: { id: categoryId } },
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { ...presigned, assetId }, // { uploadUrl, key, url, assetId }
            })
        } catch (err) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new createError.NotFound("Category not found")
            }
            throw err
        }
    }
}
