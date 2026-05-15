import { protectedApiClient } from "@/lib/http/client"

type Response = {
    statusCode: number
    payload: {
        user: {
            imageKey?: string | null
            imageUrl?: string | null
        }
    }
}

export async function updateMyProfileImage(imageKey: string | null) {
    const res = await protectedApiClient.put<Response>("/me/profile-image", {
        imageKey,
    })

    return res.data.payload.user
}
