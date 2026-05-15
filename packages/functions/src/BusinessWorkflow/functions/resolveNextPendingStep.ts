import createError from "http-errors"
import { businessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository"
import { getCurrentPendingStep } from "@/core/helpers/businessRequests/service"

type Event = {
    requestId: string
}

export const handler = async (event: Event) => {
    if (!event?.requestId) {
        throw new createError.BadRequest("requestId is required")
    }

    const request = await businessRequestRepository().getWorkflowRequest(event.requestId)
    if (!request) {
        throw new createError.NotFound("Business request not found")
    }

    const currentStep = getCurrentPendingStep(request)
    const completed = !currentStep && request.status !== "PENDING_APPROVAL"

    if (!currentStep && !completed) {
        throw new createError.Conflict("Pending request does not have an active approval step")
    }

    return {
        requestId: request.id,
        domain: request.domain,
        type: request.type,
        title: request.title,
        status: request.status,
        customerId: request.customerId,
        supplierId: request.supplierId,
        requestedByUserId: request.requestedByUserId,
        requestedByEmail: request.requestedByUser.email,
        requesterRole: request.requesterRole,
        currentStepId: currentStep?.id ?? null,
        currentStepOrder: currentStep?.stepOrder ?? null,
        currentRequiredRole: currentStep?.requiredRole ?? null,
        currentAssignedUserId: currentStep?.assignedUserId ?? null,
        completed,
    }
}
