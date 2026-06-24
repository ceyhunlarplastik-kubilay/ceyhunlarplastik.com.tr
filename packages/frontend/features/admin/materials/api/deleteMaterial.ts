import { adminApiClient } from "@/lib/http/client"

export async function deleteMaterial(id: string) {
    await adminApiClient.delete(`/materials/${id}`)
}
