import type { EventBridgeEvent } from "aws-lambda"

export type UserAccessUpdateDetail = {
    userId: string
    cognitoSub: string
    email: string
    previousGroups: string[]
    nextGroups: string[]
    previousAccessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    nextAccessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    reason?: string | null
    changedByUserId: string
    changedByEmail: string
    changedAt: string
}

export type UserAccessUpdateEvent = EventBridgeEvent<"user.access.updated", UserAccessUpdateDetail>
