import createError from "http-errors";
import { prisma } from "@/core/db/prisma";
import { businessRequestInclude, businessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository";
import { buildApprovedVariantPricingUpdate, normalizeSupplierProfileApprovalPayload, snapshotSupplierProfile, snapshotSupplierVariantPricing } from "@/core/helpers/businessRequests/supplierPayloads";
import { buildApprovalSteps, getBusinessRequestDefaultTitle, getBusinessRequestDomain, getRequesterApprovalRole } from "@/core/helpers/businessRequests/policy";
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function isSalesCounterOfferRequest(request) {
    return request.domain === "SALES"
        && (request.type === "CUSTOMER_ORDER_REQUEST" || request.type === "CUSTOMER_PRICING_REQUEST");
}
function canManageSalesCounterOffer(user, request) {
    if (!isSalesCounterOfferRequest(request))
        return false;
    if (user.isOwner || user.isAdmin || user.isSalesDirector)
        return true;
    return user.isSales
        && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === user.id);
}
function withNegotiationResponseState(requestedData, input) {
    const requestData = asRecord(requestedData);
    const latestCounterOffer = asRecord(requestData.latestCounterOffer);
    if (Object.keys(latestCounterOffer).length === 0) {
        return requestData;
    }
    return {
        ...requestData,
        latestCounterOffer: {
            ...latestCounterOffer,
            awaitingCustomerResponse: input.awaitingCustomerResponse,
            acceptedByCustomer: input.acceptedByCustomer ?? false,
            rejectedByCustomer: input.rejectedByCustomer ?? false,
            respondedAt: input.respondedAt ?? null,
        },
    };
}
function pickSupplierProfilePayload(requestedData) {
    return normalizeSupplierProfileApprovalPayload({
        ...(typeof requestedData.name === "string" ? { name: requestedData.name } : {}),
        ...(typeof requestedData.contactName === "string" ? { contactName: requestedData.contactName } : {}),
        ...(typeof requestedData.phone === "string" ? { phone: requestedData.phone } : {}),
        ...(typeof requestedData.address === "string" ? { address: requestedData.address } : {}),
        ...(typeof requestedData.taxNumber === "string" ? { taxNumber: requestedData.taxNumber } : {}),
        ...(typeof requestedData.defaultPaymentTermDays === "number"
            ? { defaultPaymentTermDays: requestedData.defaultPaymentTermDays }
            : {}),
    });
}
async function applyApprovedBusinessRequestTx(tx, request) {
    if (request.requesterRole !== "SUPPLIER" || request.domain !== "PURCHASING") {
        return;
    }
    const requestedData = asRecord(request.requestedData);
    if (request.type === "SUPPLIER_PROFILE_CHANGE") {
        if (!request.supplierId) {
            throw new createError.BadRequest("Supplier target is missing for profile change request");
        }
        const payload = pickSupplierProfilePayload(requestedData);
        await tx.supplier.update({
            where: { id: request.supplierId },
            data: payload,
        });
        return;
    }
    if (request.type === "SUPPLIER_PRICING_CHANGE") {
        const productVariantSupplierId = typeof requestedData.productVariantSupplierId === "string"
            ? requestedData.productVariantSupplierId
            : null;
        if (!productVariantSupplierId) {
            throw new createError.BadRequest("Supplier pricing request target is missing");
        }
        const existing = await tx.productVariantSupplier.findUnique({
            where: { id: productVariantSupplierId },
            include: {
                variant: {
                    include: {
                        color: true,
                        materials: true,
                        measurements: {
                            include: {
                                measurementType: true,
                            },
                        },
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                supplier: true,
            },
        });
        if (!existing) {
            throw new createError.NotFound("Variant supplier record not found");
        }
        await tx.productVariantSupplier.update({
            where: { id: productVariantSupplierId },
            data: buildApprovedVariantPricingUpdate(existing, {
                price: typeof requestedData.price === "number" ? requestedData.price : 0,
                operationalCostRate: typeof requestedData.operationalCostRate === "number" ? requestedData.operationalCostRate : undefined,
                netCost: typeof requestedData.netCost === "number" ? requestedData.netCost : undefined,
                profitRate: typeof requestedData.profitRate === "number" ? requestedData.profitRate : undefined,
                listPrice: typeof requestedData.listPrice === "number" ? requestedData.listPrice : undefined,
                paymentTermDays: typeof requestedData.paymentTermDays === "number" ? requestedData.paymentTermDays : undefined,
                supplierVariantCode: typeof requestedData.supplierVariantCode === "string" ? requestedData.supplierVariantCode : undefined,
                supplierNote: typeof requestedData.supplierNote === "string" ? requestedData.supplierNote : undefined,
                minOrderQty: typeof requestedData.minOrderQty === "number" ? requestedData.minOrderQty : undefined,
                stockQty: typeof requestedData.stockQty === "number" ? requestedData.stockQty : undefined,
                currency: typeof requestedData.currency === "string" ? requestedData.currency : undefined,
            }),
        });
    }
}
function getPendingSteps(request) {
    return request.approvalSteps.filter((step) => step.status === "PENDING");
}
export function getCurrentPendingStep(request) {
    return getPendingSteps(request)[0] ?? null;
}
export function canViewBusinessRequest(user, request) {
    if (user.isOwner || user.isAdmin)
        return true;
    if (user.isCustomer && user.customerId && request.customerId === user.customerId)
        return true;
    if (user.isSupplier && user.supplierId && request.supplierId === user.supplierId)
        return true;
    if (request.domain === "SALES") {
        if (user.isSalesDirector)
            return true;
        if (user.isSales && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === user.id))
            return true;
    }
    if (request.domain === "PURCHASING") {
        if (user.isPurchasing && request.supplier?.assignedPurchasingUserId === user.id)
            return true;
    }
    return false;
}
export function assertBusinessRequestViewAccess(user, request) {
    if (!user) {
        throw new createError.Unauthorized("Authentication required");
    }
    if (!canViewBusinessRequest(user, request)) {
        throw new createError.Forbidden("Business request access denied");
    }
}
export function canDecideBusinessRequest(user, request, step) {
    if (user.isOwner || user.isAdmin)
        return true;
    if (user.isCustomer) {
        return (step.requiredRole === "CUSTOMER"
            && !!user.customerId
            && request.customerId === user.customerId);
    }
    if (request.domain === "SALES") {
        if (user.isSalesDirector) {
            return step.requiredRole === "SALES" || step.requiredRole === "SALES_DIRECTOR";
        }
        if (user.isSales) {
            return (step.requiredRole === "SALES"
                && (!step.assignedUserId || step.assignedUserId === user.id)
                && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === user.id));
        }
    }
    if (request.domain === "PURCHASING" && user.isPurchasing) {
        return (step.requiredRole === "PURCHASING"
            && (!step.assignedUserId || step.assignedUserId === user.id)
            && request.supplier?.assignedPurchasingUserId === user.id);
    }
    return false;
}
function getDecisionOutput(input) {
    return {
        request: input.request,
        decidedStep: input.decidedStep,
        approved: input.approved,
        completed: input.completed,
    };
}
async function loadRequestInTransaction(requestId) {
    const request = await prisma.businessRequest.findUnique({
        where: { id: requestId },
        include: businessRequestInclude,
    });
    if (!request) {
        throw new createError.NotFound("Business request not found");
    }
    return request;
}
async function approveSingleStep(request, user, note) {
    const currentStep = getCurrentPendingStep(request);
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains");
    }
    const now = new Date();
    const pendingCount = getPendingSteps(request).length;
    const completed = pendingCount <= 1;
    await prisma.$transaction(async (tx) => {
        if (completed) {
            await applyApprovedBusinessRequestTx(tx, request);
        }
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: note?.trim() || null,
            },
        });
        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: completed ? "APPROVED" : "PENDING_APPROVAL",
                decidedAt: completed ? now : null,
                workflowTaskToken: null,
                ...(currentStep.requiredRole === "CUSTOMER"
                    ? {
                        requestedData: withNegotiationResponseState(request.requestedData, {
                            awaitingCustomerResponse: false,
                            acceptedByCustomer: true,
                            respondedAt: now.toISOString(),
                        }),
                    }
                    : {}),
            },
        });
    });
    const updated = await loadRequestInTransaction(request.id);
    const decidedStep = updated.approvalSteps.find((step) => step.id === currentStep.id);
    if (!decidedStep) {
        throw new createError.InternalServerError("Approved step could not be reloaded");
    }
    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: true,
        completed,
    });
}
async function approveWithAdminBypass(request, user, note) {
    const pendingSteps = getPendingSteps(request);
    if (pendingSteps.length === 0) {
        throw new createError.Conflict("No pending approval step remains");
    }
    const finalStep = pendingSteps[pendingSteps.length - 1];
    const now = new Date();
    const bypassMessage = `Bypassed by ${user.identifier}`;
    await prisma.$transaction(async (tx) => {
        await applyApprovedBusinessRequestTx(tx, request);
        for (const step of pendingSteps.slice(0, -1)) {
            await tx.businessRequestApprovalStep.update({
                where: { id: step.id },
                data: {
                    status: "SKIPPED",
                    decidedByUserId: user.id,
                    decidedAt: now,
                    decisionNote: bypassMessage,
                },
            });
        }
        await tx.businessRequestApprovalStep.update({
            where: { id: finalStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: note?.trim() || bypassMessage,
            },
        });
        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: "APPROVED",
                decidedAt: now,
                workflowTaskToken: null,
            },
        });
    });
    const updated = await loadRequestInTransaction(request.id);
    const decidedStep = updated.approvalSteps.find((step) => step.id === finalStep.id);
    if (!decidedStep) {
        throw new createError.InternalServerError("Final approval step could not be reloaded");
    }
    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: true,
        completed: true,
    });
}
async function approveWithSalesDirectorBypass(request, user, note) {
    const pendingSteps = getPendingSteps(request);
    const currentStep = pendingSteps[0];
    const salesDirectorStep = pendingSteps.find((step) => step.requiredRole === "SALES_DIRECTOR");
    if (!currentStep || !salesDirectorStep || currentStep.requiredRole !== "SALES") {
        return approveSingleStep(request, user, note);
    }
    const now = new Date();
    await prisma.$transaction(async (tx) => {
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "SKIPPED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: `Overridden by ${user.identifier}`,
            },
        });
        await tx.businessRequestApprovalStep.update({
            where: { id: salesDirectorStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: note?.trim() || null,
            },
        });
        const remainingPending = pendingSteps.filter((step) => step.id !== currentStep.id && step.id !== salesDirectorStep.id);
        if (remainingPending.length === 0) {
            await applyApprovedBusinessRequestTx(tx, request);
        }
        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: remainingPending.length === 0 ? "APPROVED" : "PENDING_APPROVAL",
                decidedAt: remainingPending.length === 0 ? now : null,
                workflowTaskToken: null,
            },
        });
    });
    const updated = await loadRequestInTransaction(request.id);
    const decidedStep = updated.approvalSteps.find((step) => step.id === salesDirectorStep.id);
    if (!decidedStep) {
        throw new createError.InternalServerError("Sales director step could not be reloaded");
    }
    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: true,
        completed: updated.status === "APPROVED",
    });
}
async function updateCounterOfferPayload(input) {
    const nowIso = new Date().toISOString();
    const requestData = asRecord(input.request.requestedData);
    const nextRound = isFiniteNumber(requestData.negotiationRound)
        ? Number(requestData.negotiationRound) + 1
        : 1;
    const counterByRole = getRequesterApprovalRole(input.user);
    const existingItems = new Map(input.request.items.map((item) => [item.id, item]));
    for (const itemInput of input.items) {
        const requestItem = existingItems.get(itemInput.requestItemId);
        if (!requestItem) {
            throw new createError.BadRequest("Counter offer item does not belong to this request");
        }
    }
    for (const requestItem of input.request.items) {
        const matchingInput = input.items.find((item) => item.requestItemId === requestItem.id);
        if (!matchingInput)
            continue;
        const currentData = asRecord(requestItem.data);
        await input.tx.businessRequestItem.update({
            where: { id: requestItem.id },
            data: {
                data: {
                    ...currentData,
                    counterUnitPrice: matchingInput.proposedUnitPrice,
                    counterCurrency: matchingInput.currency?.trim() || (typeof currentData.currency === "string" ? currentData.currency : "TRY"),
                    counterOfferedAt: nowIso,
                    counterOfferedByUserId: input.user.id,
                    counterOfferedByRole: counterByRole,
                    negotiationRound: nextRound,
                },
            },
        });
    }
    await input.tx.businessRequest.update({
        where: { id: input.request.id },
        data: {
            requestedData: {
                ...requestData,
                negotiationRound: nextRound,
                latestCounterOffer: {
                    round: nextRound,
                    note: input.note?.trim() || null,
                    counteredAt: nowIso,
                    counteredByUserId: input.user.id,
                    counteredByRole: counterByRole,
                    awaitingCustomerResponse: true,
                    itemCount: input.items.length,
                },
            },
        },
    });
}
async function insertPendingCustomerStep(input) {
    const laterSteps = input.request.approvalSteps
        .filter((step) => step.stepOrder > input.afterStepOrder)
        .sort((left, right) => right.stepOrder - left.stepOrder);
    for (const step of laterSteps) {
        await input.tx.businessRequestApprovalStep.update({
            where: { id: step.id },
            data: {
                stepOrder: step.stepOrder + 1,
            },
        });
    }
    await input.tx.businessRequestApprovalStep.create({
        data: {
            request: {
                connect: {
                    id: input.request.id,
                },
            },
            stepOrder: input.afterStepOrder + 1,
            requiredRole: "CUSTOMER",
        },
    });
}
export async function counterBusinessRequestDecision(input) {
    const request = await businessRequestRepository().getRequest(input.requestId);
    if (!request) {
        throw new createError.NotFound("Business request not found");
    }
    const currentStep = getCurrentPendingStep(request);
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains");
    }
    if (!canManageSalesCounterOffer(input.user, request)) {
        throw new createError.Forbidden("Current user cannot send a counter offer for this request");
    }
    if (input.counterOfferItems.length === 0) {
        throw new createError.BadRequest("At least one counter offer item is required");
    }
    const isCustomerRound = currentStep.requiredRole === "CUSTOMER";
    if (!isCustomerRound && !canDecideBusinessRequest(input.user, request, currentStep)) {
        throw new createError.Forbidden("Current user cannot counter on this approval step");
    }
    await prisma.$transaction(async (tx) => {
        await updateCounterOfferPayload({
            tx,
            request,
            user: input.user,
            note: input.note,
            items: input.counterOfferItems,
        });
        if (isCustomerRound) {
            return;
        }
        const now = new Date();
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: input.user.id,
                decidedAt: now,
                decisionNote: input.note?.trim() || "Counter offer sent to customer",
            },
        });
        await insertPendingCustomerStep({
            tx,
            request,
            afterStepOrder: currentStep.stepOrder,
        });
        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: "PENDING_APPROVAL",
                decidedAt: null,
                workflowTaskToken: null,
            },
        });
    });
    const updated = await loadRequestInTransaction(request.id);
    return {
        request: updated,
        shouldResumeWorkflow: !isCustomerRound,
    };
}
export async function rejectBusinessRequestDecision(input) {
    const request = await businessRequestRepository().getRequest(input.requestId);
    if (!request) {
        throw new createError.NotFound("Business request not found");
    }
    const currentStep = getCurrentPendingStep(request);
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains");
    }
    if (!canDecideBusinessRequest(input.user, request, currentStep)) {
        throw new createError.Forbidden("Current user cannot reject this approval step");
    }
    const now = new Date();
    const pendingSteps = getPendingSteps(request);
    await prisma.$transaction(async (tx) => {
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "REJECTED",
                decidedByUserId: input.user.id,
                decidedAt: now,
                decisionNote: input.note?.trim() || null,
            },
        });
        for (const step of pendingSteps.slice(1)) {
            await tx.businessRequestApprovalStep.update({
                where: { id: step.id },
                data: {
                    status: "SKIPPED",
                    decidedByUserId: input.user.id,
                    decidedAt: now,
                    decisionNote: `Closed after rejection by ${input.user.identifier}`,
                },
            });
        }
        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: "REJECTED",
                decidedAt: now,
                workflowTaskToken: null,
                ...(currentStep.requiredRole === "CUSTOMER"
                    ? {
                        requestedData: withNegotiationResponseState(request.requestedData, {
                            awaitingCustomerResponse: false,
                            rejectedByCustomer: true,
                            respondedAt: now.toISOString(),
                        }),
                    }
                    : {}),
            },
        });
    });
    const updated = await loadRequestInTransaction(request.id);
    const decidedStep = updated.approvalSteps.find((step) => step.id === currentStep.id);
    if (!decidedStep) {
        throw new createError.InternalServerError("Rejected step could not be reloaded");
    }
    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: false,
        completed: true,
    });
}
export async function approveBusinessRequestDecision(input) {
    const request = await businessRequestRepository().getRequest(input.requestId);
    if (!request) {
        throw new createError.NotFound("Business request not found");
    }
    const currentStep = getCurrentPendingStep(request);
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains");
    }
    if (!canDecideBusinessRequest(input.user, request, currentStep)) {
        throw new createError.Forbidden("Current user cannot approve this approval step");
    }
    if (input.user.isOwner || input.user.isAdmin) {
        return approveWithAdminBypass(request, input.user, input.note);
    }
    if (input.user.isSalesDirector && request.domain === "SALES" && currentStep.requiredRole === "SALES") {
        return approveWithSalesDirectorBypass(request, input.user, input.note);
    }
    return approveSingleStep(request, input.user, input.note);
}
export async function createCustomerBusinessRequest(input) {
    const requesterRole = getRequesterApprovalRole(input.requester);
    const domain = getBusinessRequestDomain(input.type);
    const approvalSteps = buildApprovalSteps({
        domain,
        requesterRole,
        customerAssignedSalesUserId: input.customer.assignedSalesUserId,
    });
    const created = await businessRequestRepository().createRequest({
        domain,
        type: input.type,
        status: approvalSteps.length > 0 ? "PENDING_APPROVAL" : "APPROVED",
        priority: input.priority ?? "NORMAL",
        title: input.title?.trim() || getBusinessRequestDefaultTitle(input.type),
        description: input.description?.trim() || null,
        entityType: input.entityType ?? "CUSTOMER",
        entityId: input.entityId ?? input.customer.id,
        customer: {
            connect: {
                id: input.customer.id,
            },
        },
        requestedByUser: {
            connect: {
                id: input.requester.id,
            },
        },
        requesterRole,
        requestedData: (input.requestedData ?? {}),
        currentSnapshot: {
            customerId: input.customer.id,
            companyName: input.customer.companyName,
            fullName: input.customer.fullName,
            phone: input.customer.phone,
            email: input.customer.email,
            note: input.customer.note,
            status: input.customer.status,
            assignedSalesUserId: input.customer.assignedSalesUserId,
            sectorValue: input.customer.sectorValue ? {
                id: input.customer.sectorValue.id,
                name: input.customer.sectorValue.name,
            } : null,
            productionGroupValue: input.customer.productionGroupValue ? {
                id: input.customer.productionGroupValue.id,
                name: input.customer.productionGroupValue.name,
            } : null,
            usageAreaValues: (input.customer.usageAreaValues ?? []).map((value) => ({
                id: value.id,
                name: value.name,
            })),
            addresses: (input.customer.addresses ?? []).map((address) => ({
                id: address.id,
                label: address.label,
                contactName: address.contactName,
                phone: address.phone,
                email: address.email,
                country: address.country,
                city: address.city,
                district: address.district,
                line1: address.line1,
                line2: address.line2,
                postalCode: address.postalCode,
                taxOffice: address.taxOffice,
                isPrimary: address.isPrimary,
                isBilling: address.isBilling,
                isShipping: address.isShipping,
                note: address.note,
                displayOrder: address.displayOrder,
            })),
        },
        ...(approvalSteps.length > 0
            ? {
                approvalSteps: {
                    create: approvalSteps.map((step) => ({
                        stepOrder: step.stepOrder,
                        requiredRole: step.requiredRole,
                        ...(step.assignedUserId
                            ? {
                                assignedUser: {
                                    connect: {
                                        id: step.assignedUserId,
                                    },
                                },
                            }
                            : {}),
                    })),
                },
            }
            : {}),
        ...(input.items?.length
            ? {
                items: {
                    create: input.items.map((item, index) => ({
                        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
                        note: item.note?.trim() || null,
                        data: item.data ? item.data : undefined,
                        displayOrder: index,
                        ...(item.productVariantId
                            ? {
                                productVariant: {
                                    connect: {
                                        id: item.productVariantId,
                                    },
                                },
                            }
                            : {}),
                    })),
                },
            }
            : {}),
        ...(approvalSteps.length === 0
            ? {
                decidedAt: new Date(),
            }
            : {}),
    });
    return created;
}
export async function createSupplierBusinessRequest(input) {
    const requesterRole = getRequesterApprovalRole(input.requester);
    const domain = getBusinessRequestDomain(input.type);
    const approvalSteps = buildApprovalSteps({
        domain,
        requesterRole,
        supplierAssignedPurchasingUserId: input.supplier.assignedPurchasingUserId,
    });
    return businessRequestRepository().createRequest({
        domain,
        type: input.type,
        status: approvalSteps.length > 0 ? "PENDING_APPROVAL" : "APPROVED",
        priority: input.priority ?? "NORMAL",
        title: input.title?.trim() || getBusinessRequestDefaultTitle(input.type),
        description: input.description?.trim() || null,
        entityType: input.entityType ?? "SUPPLIER",
        entityId: input.entityId ?? input.supplier.id,
        supplier: {
            connect: {
                id: input.supplier.id,
            },
        },
        requestedByUser: {
            connect: {
                id: input.requester.id,
            },
        },
        requesterRole,
        requestedData: (input.requestedData ?? {}),
        currentSnapshot: (input.currentSnapshot ?? snapshotSupplierProfile(input.supplier)),
        ...(approvalSteps.length > 0
            ? {
                approvalSteps: {
                    create: approvalSteps.map((step) => ({
                        stepOrder: step.stepOrder,
                        requiredRole: step.requiredRole,
                        ...(step.assignedUserId
                            ? {
                                assignedUser: {
                                    connect: {
                                        id: step.assignedUserId,
                                    },
                                },
                            }
                            : {}),
                    })),
                },
            }
            : {}),
        ...(input.items?.length
            ? {
                items: {
                    create: input.items.map((item, index) => ({
                        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
                        note: item.note?.trim() || null,
                        data: item.data ? item.data : undefined,
                        displayOrder: index,
                        ...(item.productVariantId
                            ? {
                                productVariant: {
                                    connect: {
                                        id: item.productVariantId,
                                    },
                                },
                            }
                            : {}),
                    })),
                },
            }
            : {}),
        ...(approvalSteps.length === 0
            ? {
                decidedAt: new Date(),
            }
            : {}),
    });
}
export function assertAllowedCustomerRequestType(type) {
    const allowedTypes = [
        "CUSTOMER_PROFILE_CHANGE",
        "CUSTOMER_ORDER_REQUEST",
        "CUSTOMER_DOCUMENT_REQUEST",
        "CUSTOMER_PRICING_REQUEST",
    ];
    if (!allowedTypes.includes(type)) {
        throw new createError.BadRequest("This request type cannot be created from the customer portal");
    }
}
