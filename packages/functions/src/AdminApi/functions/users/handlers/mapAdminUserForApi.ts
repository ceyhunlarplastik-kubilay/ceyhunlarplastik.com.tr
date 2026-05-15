import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"

export function mapAdminUserForApi<T extends { imageKey?: string | null }>(user: T) {
    return {
        ...user,
        imageUrl: user.imageKey ? buildAssetUrl(user.imageKey) : null,
    }
}
