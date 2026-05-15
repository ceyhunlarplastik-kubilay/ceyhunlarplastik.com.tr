import createError from "http-errors";
import { businessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository";
export const handler = async (event) => {
    if (!event?.requestId || !event?.taskToken) {
        throw new createError.BadRequest("requestId and taskToken are required");
    }
    const repository = businessRequestRepository();
    const request = await repository.getWorkflowRequest(event.requestId);
    if (!request) {
        throw new createError.NotFound("Business request not found");
    }
    if (request.status !== "PENDING_APPROVAL") {
        throw new createError.Conflict("Only pending approval requests can wait for decision");
    }
    await repository.setWorkflowTaskToken(event.requestId, event.taskToken);
    return {
        ok: true,
        requestId: event.requestId,
    };
};
