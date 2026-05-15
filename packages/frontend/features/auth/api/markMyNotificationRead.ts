import { protectedApiClient } from "@/lib/http/client"

export async function markMyNotificationRead(id: string) {
    await protectedApiClient.post(`/me/notifications/${id}/read`)
}
