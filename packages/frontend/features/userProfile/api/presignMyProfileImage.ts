import { protectedApiClient } from "@/lib/http/client"

type Params = {
    fileName: string
    contentType: string
}

type Response = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
        url: string
    }
}

export async function presignMyProfileImage(params: Params) {
    const res = await protectedApiClient.post<Response>("/me/profile-image/presign", params)
    return res.data.payload
}
