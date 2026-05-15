import { adminApiClient, protectedApiClient } from "@/lib/http/client"
import type {
    BusinessRequestDecisionAction,
    BusinessRequestDecisionResponse,
    BusinessRequestDecisionScope,
} from "@/features/businessRequests/api/types"

const decisionPathMap: Record<BusinessRequestDecisionScope, string> = {
    portal: "/portal/customer/requests",
    sales: "/sales/approval-requests",
    purchasing: "/purchasing/approval-requests",
    admin: "/approval-requests",
}

export async function decideBusinessRequest(input: {
    scope: BusinessRequestDecisionScope
    id: string
    action?: BusinessRequestDecisionAction
    approved?: boolean
    note?: string
    counterOfferItems?: Array<{
        requestItemId: string
        proposedUnitPrice: number
        currency?: string | null
    }>
}) {
    const client = input.scope === "admin" ? adminApiClient : protectedApiClient
    const res = await client.post<BusinessRequestDecisionResponse>(
        `${decisionPathMap[input.scope]}/${input.id}/decision`,
        {
            action: input.action,
            approved: input.approved,
            note: input.note,
            counterOfferItems: input.counterOfferItems,
        },
    )

    return res.data.payload
}
