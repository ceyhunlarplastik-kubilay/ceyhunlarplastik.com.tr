import createError from "http-errors"
import { apiResponse, apiResponseDTO } from "@/core/helpers/utils/api/response"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { deleteS3Object } from "@/core/helpers/s3/deleteObject"
import { generateUserProfileImageUpload } from "@/core/helpers/s3/presign"
import {
    ICreateMyProfileImageUploadEvent,
    IMyProfileImageDependencies,
    IUpdateMyProfileImageEvent,
} from "@/functions/ProtectedApi/types/users"

function ensureImageContentType(contentType: string) {
    const normalized = contentType.trim().toLowerCase()

    if (!normalized.startsWith("image/")) {
        throw new createError.BadRequest("Sadece gorsel dosyalari yuklenebilir.")
    }
}

function mapUserWithImage(user: { imageKey?: string | null } & Record<string, unknown>) {
    return {
        ...user,
        imageUrl: user.imageKey ? buildAssetUrl(user.imageKey) : null,
    }
}

export const createMyProfileImageUploadHandler =
    ({ userRepository }: IMyProfileImageDependencies) =>
        async (event: ICreateMyProfileImageUploadEvent) => {
            const authUser = event.user

            if (!authUser) {
                throw new createError.Unauthorized("User context missing")
            }

            const fileName = event.body?.fileName?.trim()
            const contentType = event.body?.contentType?.trim()

            if (!fileName || !contentType) {
                throw new createError.BadRequest("fileName ve contentType zorunlu.")
            }

            ensureImageContentType(contentType)

            const user = await userRepository.getUserById(authUser.id)
            if (!user) {
                throw new createError.NotFound("User not found")
            }

            const upload = await generateUserProfileImageUpload({
                userId: user.id,
                fileName,
                contentType,
            })

            return apiResponse({
                statusCode: 200,
                payload: upload,
            })
        }

export const updateMyProfileImageHandler =
    ({ userRepository }: IMyProfileImageDependencies) =>
        async (event: IUpdateMyProfileImageEvent) => {
            const authUser = event.user

            if (!authUser) {
                throw new createError.Unauthorized("User context missing")
            }

            const currentUser = await userRepository.getUserById(authUser.id)
            if (!currentUser) {
                throw new createError.NotFound("User not found")
            }

            const nextImageKey = event.body?.imageKey ?? null
            const updated = await userRepository.updateImageKey(currentUser.id, nextImageKey)

            if (currentUser.imageKey && currentUser.imageKey !== nextImageKey) {
                await deleteS3Object(currentUser.imageKey).catch((error) => {
                    console.error("Failed to delete previous profile image", error)
                })
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user: mapUserWithImage(updated),
                },
            })
        }
