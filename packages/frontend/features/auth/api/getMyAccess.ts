import { protectedApiClient } from "@/lib/http/client"

export type MyAccessResponse = {
    statusCode: number
    payload: {
        user: {
            id: string
            email: string
            identifier: string
            firstName?: string | null
            lastName?: string | null
            groups: string[]
            accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
            accessStatusChangedAt?: string | null
            accessStatusReason?: string | null
            customerId?: string | null
            supplierId?: string | null
            isActive: boolean
            createdAt: string
            updatedAt: string
        }
        canAccessPanels: boolean
    }
}

export async function getMyAccess() {
    const res = await protectedApiClient.get<MyAccessResponse>("/me/access")
    return res.data.payload
}
