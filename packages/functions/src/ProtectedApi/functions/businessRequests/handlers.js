import { SFNClient, SendTaskSuccessCommand, StartExecutionCommand } from "@aws-sdk/client-sfn";
import createError from "http-errors";
import { approveBusinessRequestDecision, assertAllowedCustomerRequestType, counterBusinessRequestDecision, createCustomerBusinessRequest, createSupplierBusinessRequest, rejectBusinessRequestDecision } from "@/core/helpers/businessRequests/service";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
import { normalizeSupplierProfileApprovalPayload, normalizeSupplierVariantPricingApprovalPayload, snapshotSupplierProfile, snapshotSupplierVariantPricing } from "@/core/helpers/businessRequests/supplierPayloads";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
const sfn = new SFNClient({});
async function startBusinessWorkflow(input) {
    const request = input.request;
    if (!request) {
        throw new createError.InternalServerError("Business request could not be loaded");
    }
    const execution = await sfn.send(new StartExecutionCommand({
        stateMachineArn: input.workflowArn,
        name: `business-request-${request.id}`,
        input: JSON.stringify({
            requestId: request.id,
            domain: request.domain,
            type: request.type,
            title: request.title,
            customerId: request.customerId,
            supplierId: request.supplierId,
            requestedByUserId: request.requestedByUserId,
            requestedByEmail: request.requestedByUser.email,
            requesterRole: request.requesterRole,
        }),
    }));
    if (execution.executionArn) {
        await input.businessRequestRepository.setWorkflowExecutionArn(request.id, execution.executionArn);
    }
}
export const listPortalBusinessRequestsHandler = ({ businessRequestRepository }) => async (event) => {
    const user = event.user;
    if (!user?.customerId) {
        throw new createError.Forbidden("Customer portal context missing");
    }
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
        customerId: user.customerId,
        domain: "SALES",
        status: query.status,
        type: query.type,
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: result,
    });
};
export const createPortalBusinessRequestHandler = ({ businessRequestRepository, customerRepository, workflowArn }) => async (event) => {
    const user = event.user;
    if (!user?.customerId || !user.isCustomer) {
        throw new createError.Forbidden("Customer portal context missing");
    }
    if (!workflowArn) {
        throw new createError.InternalServerError("Business workflow configuration is missing");
    }
    const body = event.body;
    assertAllowedCustomerRequestType(body.type);
    const customer = await customerRepository.getCustomer(user.customerId);
    if (!customer) {
        throw new createError.NotFound("Customer profile not found");
    }
    const created = await createCustomerBusinessRequest({
        requester: user,
        customer,
        type: body.type,
        title: body.title,
        description: body.description,
        entityType: body.entityType,
        entityId: body.entityId,
        priority: body.priority,
        requestedData: body.requestedData,
        items: body.items,
    });
    try {
        const execution = await sfn.send(new StartExecutionCommand({
            stateMachineArn: workflowArn,
            name: `business-request-${created.id}`,
            input: JSON.stringify({
                requestId: created.id,
                domain: created.domain,
                type: created.type,
                title: created.title,
                customerId: created.customerId,
                supplierId: created.supplierId,
                requestedByUserId: created.requestedByUserId,
                requestedByEmail: created.requestedByUser.email,
                requesterRole: created.requesterRole,
            }),
        }));
        if (execution.executionArn) {
            await businessRequestRepository.setWorkflowExecutionArn(created.id, execution.executionArn);
        }
    }
    catch (error) {
        await businessRequestRepository.deleteRequest(created.id);
        console.error(error);
        throw new createError.InternalServerError("Business workflow could not be started");
    }
    const reloaded = await businessRequestRepository.getRequest(created.id);
    if (!reloaded) {
        throw new createError.InternalServerError("Created request could not be reloaded");
    }
    return apiResponseDTO({
        statusCode: 202,
        payload: {
            request: reloaded,
        },
    });
};
export const listSalesBusinessRequestsHandler = ({ businessRequestRepository }) => async (event) => {
    const user = event.user;
    if (!user) {
        throw new createError.Forbidden("User context missing");
    }
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
        domain: "SALES",
        status: query.status,
        type: query.type,
        ...(user.isSales && !user.isSalesDirector && !user.isAdmin && !user.isOwner
            ? { customerAssignedSalesUserId: user.id }
            : {}),
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: result,
    });
};
export const listSupplierBusinessRequestsHandler = ({ businessRequestRepository }) => async (event) => {
    const user = event.user;
    if (!user?.supplierId || !user.isSupplier) {
        throw new createError.Forbidden("Supplier context missing");
    }
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
        domain: "PURCHASING",
        supplierId: user.supplierId,
        status: query.status,
        type: query.type,
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: result,
    });
};
export const listPurchasingBusinessRequestsHandler = ({ businessRequestRepository }) => async (event) => {
    const user = event.user;
    if (!user) {
        throw new createError.Forbidden("User context missing");
    }
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
        domain: "PURCHASING",
        status: query.status,
        type: query.type,
        ...(user.isPurchasing && !user.isAdmin && !user.isOwner
            ? { supplierAssignedPurchasingUserId: user.id }
            : {}),
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: result,
    });
};
export const requestSupplierProfileBusinessRequestHandler = ({ businessRequestRepository, supplierRepository, workflowArn }) => async (event) => {
    const user = event.user;
    if (!user?.supplierId || !user.isSupplier) {
        throw new createError.Forbidden("Supplier context missing");
    }
    if (!workflowArn) {
        throw new createError.InternalServerError("Business workflow configuration is missing");
    }
    const supplier = await supplierRepository.getSupplier(user.supplierId);
    if (!supplier) {
        throw new createError.NotFound("Supplier profile not found");
    }
    const payload = normalizeSupplierProfileApprovalPayload(event.body ?? {});
    if (Object.keys(payload).length === 0) {
        throw new createError.BadRequest("At least one field must be provided");
    }
    const existingPending = await businessRequestRepository.listRequests({
        page: 1,
        limit: 1,
        supplierId: supplier.id,
        domain: "PURCHASING",
        type: "SUPPLIER_PROFILE_CHANGE",
        status: "PENDING_APPROVAL",
    });
    if (existingPending.data.length > 0) {
        throw new createError.Conflict("Bu tedarikçi profili için bekleyen bir iş talebi zaten var");
    }
    const created = await createSupplierBusinessRequest({
        requester: user,
        supplier,
        type: "SUPPLIER_PROFILE_CHANGE",
        title: "Tedarikçi profil değişikliği talebi",
        entityType: "SUPPLIER",
        entityId: supplier.id,
        requestedData: payload,
        currentSnapshot: snapshotSupplierProfile(supplier),
    });
    try {
        await startBusinessWorkflow({
            workflowArn,
            businessRequestRepository,
            request: created,
        });
    }
    catch (error) {
        await businessRequestRepository.deleteRequest(created.id);
        console.error(error);
        throw new createError.InternalServerError("Business workflow could not be started");
    }
    const reloaded = await businessRequestRepository.getRequest(created.id);
    if (!reloaded) {
        throw new createError.InternalServerError("Created request could not be reloaded");
    }
    return apiResponseDTO({
        statusCode: 202,
        payload: {
            request: reloaded,
        },
    });
};
export const requestSupplierVariantPricingBusinessRequestHandler = ({ businessRequestRepository, productVariantSupplierRepository, supplierRepository, workflowArn }) => async (event) => {
    const user = event.user;
    if (!user?.supplierId || !user.isSupplier) {
        throw new createError.Forbidden("Supplier context missing");
    }
    if (!workflowArn) {
        throw new createError.InternalServerError("Business workflow configuration is missing");
    }
    const supplier = await supplierRepository.getSupplier(user.supplierId);
    if (!supplier) {
        throw new createError.NotFound("Supplier profile not found");
    }
    const productVariantSupplier = await productVariantSupplierRepository.getProductVariantSupplier(event.pathParameters.id);
    if (!productVariantSupplier) {
        throw new createError.NotFound("Variant supplier record not found");
    }
    if (productVariantSupplier.supplierId !== user.supplierId) {
        throw new createError.Forbidden("You can only request updates for your own supplier prices");
    }
    if (event.body.profitRate !== undefined || event.body.listPrice !== undefined) {
        throw new createError.Forbidden("You are not allowed to request profit or list price changes");
    }
    const existingPending = await businessRequestRepository.listRequests({
        page: 1,
        limit: 1,
        supplierId: supplier.id,
        domain: "PURCHASING",
        type: "SUPPLIER_PRICING_CHANGE",
        status: "PENDING_APPROVAL",
        search: productVariantSupplier.variant.fullCode,
    });
    if (existingPending.data.some((request) => request.entityId === productVariantSupplier.id)) {
        throw new createError.Conflict("Bu varyant için bekleyen bir iş talebi zaten var");
    }
    const payload = normalizeSupplierVariantPricingApprovalPayload(event.body);
    const created = await createSupplierBusinessRequest({
        requester: user,
        supplier,
        type: "SUPPLIER_PRICING_CHANGE",
        title: `${productVariantSupplier.variant.fullCode} varyantı için fiyat değişikliği talebi`,
        entityType: "PRODUCT_VARIANT",
        entityId: productVariantSupplier.id,
        requestedData: {
            ...payload,
            productVariantSupplierId: productVariantSupplier.id,
            productVariantId: productVariantSupplier.variantId,
            productId: productVariantSupplier.variant.productId,
            variantFullCode: productVariantSupplier.variant.fullCode,
        },
        currentSnapshot: {
            ...snapshotSupplierVariantPricing(productVariantSupplier),
            productVariantSupplierId: productVariantSupplier.id,
            productVariantId: productVariantSupplier.variantId,
            productId: productVariantSupplier.variant.productId,
            variantFullCode: productVariantSupplier.variant.fullCode,
        },
        items: [
            {
                productVariantId: productVariantSupplier.variantId,
                quantity: 1,
                data: {
                    productId: productVariantSupplier.variant.productId,
                    productName: productVariantSupplier.variant.product.name,
                    productCode: productVariantSupplier.variant.product.code,
                    variantFullCode: productVariantSupplier.variant.fullCode,
                    listUnitPrice: productVariantSupplier.listPrice ?? null,
                    targetUnitPrice: payload.price,
                    currency: payload.currency ?? productVariantSupplier.currency ?? "TRY",
                },
            },
        ],
    });
    try {
        await startBusinessWorkflow({
            workflowArn,
            businessRequestRepository,
            request: created,
        });
    }
    catch (error) {
        await businessRequestRepository.deleteRequest(created.id);
        console.error(error);
        throw new createError.InternalServerError("Business workflow could not be started");
    }
    const reloaded = await businessRequestRepository.getRequest(created.id);
    if (!reloaded) {
        throw new createError.InternalServerError("Created request could not be reloaded");
    }
    return apiResponseDTO({
        statusCode: 202,
        payload: {
            request: reloaded,
        },
    });
};
export const decideBusinessRequestHandler = ({ businessRequestRepository }) => async (event) => {
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
