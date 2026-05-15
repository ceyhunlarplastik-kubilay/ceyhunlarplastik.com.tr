import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import createError from "http-errors";
import { approveBusinessRequestDecision, counterBusinessRequestDecision, rejectBusinessRequestDecision } from "@/core/helpers/businessRequests/service";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
const sfn = new SFNClient({});
export const listAdminBusinessRequestsHandler = ({ businessRequestRepository }) => async (event) => {
    const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
        allowedSortFields: ["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"],
        defaultSort: "createdAt",
    });
    const query = event.queryStringParameters ?? {};
    const result = await businessRequestRepository.listRequests({
        page,
        limit,
        search,
        sort,
        order,
        status: query.status,
        type: query.type,
        domain: query.domain,
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: result,
    });
};
export const decideAdminBusinessRequestHandler = ({ businessRequestRepository }) => async (event) => {
    const user = event.user;
    if (!user) {
        throw new createError.Forbidden("User context missing");
    }
    const existing = await businessRequestRepository.getRequest(event.pathParameters.id);
    if (!existing) {
        throw new createError.NotFound("Business request not found");
    }
    if (existing.status !== "PENDING_APPROVAL") {
        throw new createError.Conflict("This request has already been finalized");
    }
    if (!existing.workflowTaskToken) {
        throw new createError.Conflict("Workflow task token is missing for this request");
    }
    const action = event.body.action ?? (event.body.approved === false ? "REJECT" : "APPROVE");
    const currentStep = existing.approvalSteps.find((step) => step.status === "PENDING") ?? null;
    if (action === "COUNTER") {
        const result = await counterBusinessRequestDecision({
            requestId: existing.id,
            user,
            note: event.body.note,
            counterOfferItems: event.body.counterOfferItems ?? [],
        });
        if (result.shouldResumeWorkflow) {
            try {
                await sfn.send(new SendTaskSuccessCommand({
                    taskToken: existing.workflowTaskToken,
                    output: JSON.stringify({
                        requestId: result.request.id,
                        domain: result.request.domain,
                        type: result.request.type,
                        title: result.request.title,
                        status: result.request.status,
                        customerId: result.request.customerId,
                        supplierId: result.request.supplierId,
                        requestedByUserId: result.request.requestedByUserId,
                        requestedByEmail: result.request.requestedByUser.email,
                        requesterRole: result.request.requesterRole,
                        decidedStepId: currentStep?.id ?? null,
                        decidedStepOrder: currentStep?.stepOrder ?? null,
                        decidedRequiredRole: currentStep?.requiredRole ?? null,
                        decidedByUserId: user.id,
                        decidedByEmail: user.email,
                        note: event.body.note?.trim() || null,
                        approved: true,
                        completed: false,
                    }),
                }));
            }
            catch (error) {
                console.error(error);
            }
        }
        return apiResponseDTO({
            statusCode: 200,
            payload: {
                accepted: true,
                request: result.request,
            },
        });
    }
    const approved = action === "APPROVE";
    const decision = approved
        ? await approveBusinessRequestDecision({
            requestId: existing.id,
            user,
            note: event.body.note,
        })
        : await rejectBusinessRequestDecision({
            requestId: existing.id,
            user,
            note: event.body.note,
        });
    try {
        await sfn.send(new SendTaskSuccessCommand({
            taskToken: existing.workflowTaskToken,
            output: JSON.stringify({
                requestId: decision.request.id,
                domain: decision.request.domain,
                type: decision.request.type,
                title: decision.request.title,
                status: decision.request.status,
                customerId: decision.request.customerId,
                supplierId: decision.request.supplierId,
                requestedByUserId: decision.request.requestedByUserId,
                requestedByEmail: decision.request.requestedByUser.email,
                requesterRole: decision.request.requesterRole,
                decidedStepId: decision.decidedStep.id,
                decidedStepOrder: decision.decidedStep.stepOrder,
                decidedRequiredRole: decision.decidedStep.requiredRole,
                decidedByUserId: user.id,
                decidedByEmail: user.email,
                note: event.body.note?.trim() || null,
                approved,
                completed: decision.completed,
            }),
        }));
    }
    catch (error) {
        console.error(error);
    }
    return apiResponseDTO({
        statusCode: 200,
        payload: {
            accepted: true,
            request: decision.request,
        },
    });
};
