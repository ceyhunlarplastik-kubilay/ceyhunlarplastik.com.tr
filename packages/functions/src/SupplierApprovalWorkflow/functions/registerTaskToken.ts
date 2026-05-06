import createError from "http-errors"
import { supplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"

type Event = {
    requestId: string
    taskToken: string
}

export const handler = async (event: Event) => {
    if (!event?.requestId || !event?.taskToken) {
        throw new createError.BadRequest("requestId and taskToken are required")
    }

    const repository = supplierApprovalRequestRepository()
    const existing = await repository.getApprovalRequest(event.requestId)

    if (!existing) {
        throw new createError.NotFound("Approval request not found")
    }

    if (existing.status !== "PENDING") {
        throw new createError.Conflict("Only pending requests can wait for decision")
    }

    await repository.updateWorkflowTaskToken(event.requestId, event.taskToken)

    return {
        ok: true,
        requestId: event.requestId,
    }
}
