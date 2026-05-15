import type { EventBridgeEvent } from "aws-lambda"
import type {
    ApprovalRole,
    BusinessRequestDomain,
    BusinessRequestStatus,
    BusinessRequestType,
} from "@/prisma/generated/prisma/client"

export type BusinessWorkflowEventDetail = {
    requestId: string
    domain: BusinessRequestDomain
    type: BusinessRequestType
    title: string
    status?: BusinessRequestStatus
    customerId?: string | null
    supplierId?: string | null
    requestedByUserId: string
    requestedByEmail?: string | null
    requesterRole: ApprovalRole
    stepId?: string | null
    stepOrder?: number | null
    requiredRole?: ApprovalRole | null
    assignedUserId?: string | null
    decidedByUserId?: string | null
    decidedByEmail?: string | null
    note?: string | null
    occurredAt?: string
}

export type BusinessWorkflowEvent = EventBridgeEvent<string, BusinessWorkflowEventDetail>
