import createError from "http-errors"
import { supplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"

type Event = {
    requestId: string
    approved: boolean
    reviewerUserId: string
    reviewerEmail: string
    note?: string | null
}

export const handler = async (event: Event) => {
    if (!event?.requestId || !event?.reviewerUserId) {
        throw new createError.BadRequest("requestId and reviewerUserId are required")
    }

    if (event.approved) {
        throw new createError.BadRequest("Rejected event expected")
    }

    const repository = supplierApprovalRequestRepository()
    const request = await repository.getApprovalRequest(event.requestId)

    if (!request) {
        throw new createError.NotFound("Approval request not found")
    }

    if (request.status !== "PENDING") {
        return request
    }

    return repository.resolveApprovalRequest(request.id, {
        status: "REJECTED",
        reviewedByUserId: event.reviewerUserId,
        decisionNote: event.note?.trim() || null,
        decidedAt: new Date(),
    })
}
