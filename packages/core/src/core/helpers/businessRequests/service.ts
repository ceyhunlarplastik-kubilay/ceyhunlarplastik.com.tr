import createError from "http-errors"
import slugify from "slugify"

import { prisma } from "@/core/db/prisma"
import { businessRequestInclude, businessRequestRepository, type BusinessRequestApprovalStepWithRelations, type BusinessRequestWithRelations } from "@/core/helpers/prisma/businessRequests/repository"
import type { CustomerDetail } from "@/core/helpers/prisma/customers/repository"
import type { ProductVariantSupplierWithRelations } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import type { SupplierWithRelations } from "@/core/helpers/prisma/suppliers/repository"
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier"
import {
    buildApprovedVariantPricingUpdate,
    normalizeSupplierProfileApprovalPayload,
    snapshotSupplierProfile,
    snapshotSupplierVariantPricing,
} from "@/core/helpers/businessRequests/supplierPayloads"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import type {
    ApprovalRole,
    BusinessRequestEntityType,
    BusinessRequestPriority,
    BusinessRequestType,
    Prisma,
} from "@/prisma/generated/prisma/client"
import { buildApprovalSteps, getBusinessRequestDefaultTitle, getBusinessRequestDomain, getRequesterApprovalRole } from "@/core/helpers/businessRequests/policy"

type RequestWithApprovalSteps<TStep> = {
    approvalSteps: TStep[]
}

type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

type CounterOfferItemInput = {
    requestItemId: string
    proposedUnitPrice: number
    currency?: string | null
}

function asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value)
}

function isSalesCounterOfferRequest(request: Pick<BusinessRequestWithRelations, "domain" | "type">) {
    return request.domain === "SALES"
        && (request.type === "CUSTOMER_ORDER_REQUEST" || request.type === "CUSTOMER_PRICING_REQUEST")
}

function canManageSalesCounterOffer(user: IAuthenticatedUser, request: BusinessRequestWithRelations) {
    if (!isSalesCounterOfferRequest(request)) return false
    if (user.isOwner || user.isAdmin || user.isSalesDirector) return true

    return user.isSales
        && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === user.id)
}

function withNegotiationResponseState(
    requestedData: BusinessRequestWithRelations["requestedData"],
    input: {
        awaitingCustomerResponse: boolean
        acceptedByCustomer?: boolean
        rejectedByCustomer?: boolean
        respondedAt?: string
    },
) {
    const requestData = asRecord(requestedData)
    const latestCounterOffer = asRecord(requestData.latestCounterOffer)

    if (Object.keys(latestCounterOffer).length === 0) {
        return requestData as Prisma.InputJsonValue
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
    } as Prisma.InputJsonValue
}

function pickSupplierProfilePayload(requestedData: Record<string, unknown>) {
    return normalizeSupplierProfileApprovalPayload({
        ...(typeof requestedData.name === "string" ? { name: requestedData.name } : {}),
        ...(typeof requestedData.contactName === "string" ? { contactName: requestedData.contactName } : {}),
        ...(typeof requestedData.phone === "string" ? { phone: requestedData.phone } : {}),
        ...(typeof requestedData.address === "string" ? { address: requestedData.address } : {}),
        ...(typeof requestedData.taxNumber === "string" ? { taxNumber: requestedData.taxNumber } : {}),
        ...(typeof requestedData.defaultPaymentTermDays === "number"
            ? { defaultPaymentTermDays: requestedData.defaultPaymentTermDays }
            : {}),
    })
}

function normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

function normalizeVariantMeasurements(
    value: unknown,
): Array<{ measurementTypeId: string; value: number; label: string }> {
    if (!Array.isArray(value)) return []

    return value.flatMap((item) => {
        if (!item || typeof item !== "object") return []
        const record = item as Record<string, unknown>
        if (typeof record.measurementTypeId !== "string" || !isFiniteNumber(record.value)) return []

        return [{
            measurementTypeId: record.measurementTypeId,
            value: record.value,
            label: typeof record.label === "string" ? record.label : "",
        }]
    })
}

async function applyApprovedBusinessRequestTx(
    tx: PrismaTransactionClient,
    request: BusinessRequestWithRelations,
) {
    if (request.requesterRole !== "SUPPLIER" || request.domain !== "PURCHASING") {
        return
    }

    const requestedData = asRecord(request.requestedData)

    if (request.type === "SUPPLIER_PROFILE_CHANGE") {
        if (!request.supplierId) {
            throw new createError.BadRequest("Supplier target is missing for profile change request")
        }

        const payload = pickSupplierProfilePayload(requestedData)
        await tx.supplier.update({
            where: { id: request.supplierId },
            data: payload,
        })
        return
    }

    if (request.type === "SUPPLIER_PRICING_CHANGE") {
        const productVariantSupplierId = typeof requestedData.productVariantSupplierId === "string"
            ? requestedData.productVariantSupplierId
            : null

        if (!productVariantSupplierId) {
            throw new createError.BadRequest("Supplier pricing request target is missing")
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
        })

        if (!existing) {
            throw new createError.NotFound("Variant supplier record not found")
        }

        await tx.productVariantSupplier.update({
            where: { id: productVariantSupplierId },
            data: buildApprovedVariantPricingUpdate(existing as ProductVariantSupplierWithRelations, {
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
        })
        return
    }

    if (request.type === "SUPPLIER_CATEGORY_CREATE") {
        const name = typeof requestedData.name === "string" ? requestedData.name.trim() : ""
        const code = typeof requestedData.code === "number" ? requestedData.code : null
        const allowedAttributeValueIds = normalizeStringArray(requestedData.allowedAttributeValueIds)

        if (!name || code === null) {
            throw new createError.BadRequest("Supplier category create request payload is incomplete")
        }

        await tx.category.create({
            data: {
                code,
                name,
                slug: slugify(name, { lower: true, strict: true, locale: "tr" }),
                ...(allowedAttributeValueIds.length > 0 ? { allowedAttributeValueIds } : {}),
            },
        })
        return
    }

    if (request.type === "SUPPLIER_PRODUCT_CREATE") {
        const categoryId = typeof requestedData.categoryId === "string" ? requestedData.categoryId : ""
        const code = typeof requestedData.code === "string" ? requestedData.code.trim() : ""
        const name = typeof requestedData.name === "string" ? requestedData.name.trim() : ""
        const description = typeof requestedData.description === "string" ? requestedData.description.trim() : ""
        const attributeValueIds = normalizeStringArray(requestedData.attributeValueIds)

        if (!categoryId || !code || !name) {
            throw new createError.BadRequest("Supplier product create request payload is incomplete")
        }

        const category = await tx.category.findUnique({
            where: { id: categoryId },
        })
        if (!category) {
            throw new createError.NotFound("Category not found for supplier product request")
        }
        if (Number(code.split(".")[0]) !== category.code) {
            throw new createError.BadRequest(`Product code must start with category code ${category.code}`)
        }

        await tx.product.create({
            data: {
                code,
                name,
                description: description || undefined,
                slug: slugify(name, { lower: true, strict: true, locale: "tr" }),
                category: { connect: { id: categoryId } },
                ...(attributeValueIds.length > 0
                    ? {
                        attributeValues: {
                            connect: attributeValueIds.map((id) => ({ id })),
                        },
                    }
                    : {}),
            },
        })
        return
    }

    if (request.type === "SUPPLIER_VARIANT_CREATE") {
        const productId = typeof requestedData.productId === "string" ? requestedData.productId : ""
        const variantIndex = typeof requestedData.variantIndex === "number" ? requestedData.variantIndex : null
        const versionCode = typeof requestedData.versionCode === "string" ? requestedData.versionCode.trim() : ""
        const supplierCode = typeof requestedData.supplierCode === "string" ? requestedData.supplierCode.trim() : ""
        const name = typeof requestedData.name === "string" ? requestedData.name.trim() : ""
        const colorId = typeof requestedData.colorId === "string" ? requestedData.colorId : undefined
        const materialIds = normalizeStringArray(requestedData.materialIds)
        const measurements = normalizeVariantMeasurements(requestedData.measurements)

        if (!request.supplierId) {
            throw new createError.BadRequest("Supplier target is missing for variant create request")
        }
        if (!productId || variantIndex === null || !versionCode || !supplierCode || !name) {
            throw new createError.BadRequest("Supplier variant create request payload is incomplete")
        }

        const product = await tx.product.findUnique({
            where: { id: productId },
        })
        if (!product) {
            throw new createError.NotFound("Product not found for supplier variant request")
        }

        const fullCode = `${product.code}.${supplierCode}.${versionCode}.${variantIndex}`

        await tx.productVariant.create({
            data: {
                product: { connect: { id: productId } },
                versionCode,
                supplierCode,
                variantIndex,
                fullCode,
                name,
                ...(colorId ? { color: { connect: { id: colorId } } } : {}),
                ...(materialIds.length > 0
                    ? {
                        materials: {
                            connect: materialIds.map((id) => ({ id })),
                        },
                    }
                    : {}),
                variantSuppliers: {
                    create: [{
                        supplier: { connect: { id: request.supplierId } },
                        isActive: true,
                        ...resolveProductVariantSupplierPricing({
                            price: typeof requestedData.price === "number" ? requestedData.price : undefined,
                            operationalCostRate: typeof requestedData.operationalCostRate === "number" ? requestedData.operationalCostRate : undefined,
                            netCost: typeof requestedData.netCost === "number" ? requestedData.netCost : undefined,
                            profitRate: typeof requestedData.profitRate === "number" ? requestedData.profitRate : undefined,
                            listPrice: typeof requestedData.listPrice === "number" ? requestedData.listPrice : undefined,
                        }),
                        ...(typeof requestedData.paymentTermDays === "number" ? { paymentTermDays: requestedData.paymentTermDays } : {}),
                        ...(typeof requestedData.supplierVariantCode === "string" ? { supplierVariantCode: requestedData.supplierVariantCode.trim() } : {}),
                        ...(typeof requestedData.supplierNote === "string" ? { supplierNote: requestedData.supplierNote.trim() } : {}),
                        ...(typeof requestedData.minOrderQty === "number" ? { minOrderQty: requestedData.minOrderQty } : {}),
                        ...(typeof requestedData.stockQty === "number" ? { stockQty: requestedData.stockQty } : {}),
                        ...(typeof requestedData.currency === "string" ? { currency: requestedData.currency.toUpperCase() } : {}),
                        ...((typeof requestedData.minOrderQty === "number" || typeof requestedData.stockQty === "number")
                            ? { availabilityUpdatedAt: new Date() }
                            : {}),
                    }],
                },
                ...(measurements.length > 0
                    ? {
                        measurements: {
                            create: measurements.map((measurement) => ({
                                measurementType: { connect: { id: measurement.measurementTypeId } },
                                value: measurement.value,
                                label: measurement.label,
                            })),
                        },
                    }
                    : {}),
            },
        })
    }
}

function getPendingSteps<TStep extends { status: string }>(request: RequestWithApprovalSteps<TStep>) {
    return request.approvalSteps.filter((step) => step.status === "PENDING")
}

export function getCurrentPendingStep<TStep extends { status: string }>(request: RequestWithApprovalSteps<TStep>) {
    return getPendingSteps(request)[0] ?? null
}

export function canViewBusinessRequest(user: IAuthenticatedUser, request: BusinessRequestWithRelations) {
    if (user.isOwner || user.isAdmin) return true

    if (user.isCustomer && user.customerId && request.customerId === user.customerId) return true
    if (user.isSupplier && user.supplierId && request.supplierId === user.supplierId) return true

    if (request.domain === "SALES") {
        if (user.isSalesDirector) return true
        if (user.isSales && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === user.id)) return true
    }

    if (request.domain === "PURCHASING") {
        if (user.isPurchasing && (request.supplier?.assignedPurchasingSuppliers ?? []).some((assignedUser) => assignedUser.id === user.id)) return true
    }

    return false
}

export function assertBusinessRequestViewAccess(user: IAuthenticatedUser | undefined, request: BusinessRequestWithRelations) {
    if (!user) {
        throw new createError.Unauthorized("Authentication required")
    }

    if (!canViewBusinessRequest(user, request)) {
        throw new createError.Forbidden("Business request access denied")
    }
}

export function canDecideBusinessRequest(user: IAuthenticatedUser, request: BusinessRequestWithRelations, step: BusinessRequestApprovalStepWithRelations) {
    if (user.isOwner || user.isAdmin) return true

    if (user.isCustomer) {
        return (
            step.requiredRole === "CUSTOMER"
            && !!user.customerId
            && request.customerId === user.customerId
        )
    }

    if (request.domain === "SALES") {
        if (user.isSalesDirector) {
            return step.requiredRole === "SALES" || step.requiredRole === "SALES_DIRECTOR"
        }

        if (user.isSales) {
            return (
                step.requiredRole === "SALES"
                && (!step.assignedUserId || step.assignedUserId === user.id)
                && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === user.id)
            )
        }
    }

    if (request.domain === "PURCHASING" && user.isPurchasing) {
        return (
            step.requiredRole === "PURCHASING"
            && (!step.assignedUserId || step.assignedUserId === user.id)
            && (request.supplier?.assignedPurchasingSuppliers ?? []).some((assignedUser) => assignedUser.id === user.id)
        )
    }

    return false
}

function getDecisionOutput(input: {
    request: BusinessRequestWithRelations
    decidedStep: BusinessRequestApprovalStepWithRelations
    approved: boolean
    completed: boolean
}) {
    return {
        request: input.request,
        decidedStep: input.decidedStep,
        approved: input.approved,
        completed: input.completed,
    }
}

async function loadRequestInTransaction(requestId: string) {
    const request = await prisma.businessRequest.findUnique({
        where: { id: requestId },
        include: businessRequestInclude,
    })

    if (!request) {
        throw new createError.NotFound("Business request not found")
    }

    return request
}

async function approveSingleStep(request: BusinessRequestWithRelations, user: IAuthenticatedUser, note?: string | null) {
    const currentStep = getCurrentPendingStep(request)
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains")
    }

    const now = new Date()
    const pendingCount = getPendingSteps(request).length
    const completed = pendingCount <= 1

    await prisma.$transaction(async (tx) => {
        if (completed) {
            await applyApprovedBusinessRequestTx(tx, request)
        }

        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: note?.trim() || null,
            },
        })

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
        })
    })

    const updated = await loadRequestInTransaction(request.id)
    const decidedStep = updated.approvalSteps.find((step) => step.id === currentStep.id)
    if (!decidedStep) {
        throw new createError.InternalServerError("Approved step could not be reloaded")
    }

    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: true,
        completed,
    })
}

async function approveWithAdminBypass(request: BusinessRequestWithRelations, user: IAuthenticatedUser, note?: string | null) {
    const pendingSteps = getPendingSteps(request)
    if (pendingSteps.length === 0) {
        throw new createError.Conflict("No pending approval step remains")
    }

    const finalStep = pendingSteps[pendingSteps.length - 1]
    const now = new Date()
    const bypassMessage = `Bypassed by ${user.identifier}`

    await prisma.$transaction(async (tx) => {
        await applyApprovedBusinessRequestTx(tx, request)

        for (const step of pendingSteps.slice(0, -1)) {
            await tx.businessRequestApprovalStep.update({
                where: { id: step.id },
                data: {
                    status: "SKIPPED",
                    decidedByUserId: user.id,
                    decidedAt: now,
                    decisionNote: bypassMessage,
                },
            })
        }

        await tx.businessRequestApprovalStep.update({
            where: { id: finalStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: note?.trim() || bypassMessage,
            },
        })

        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: "APPROVED",
                decidedAt: now,
                workflowTaskToken: null,
            },
        })
    })

    const updated = await loadRequestInTransaction(request.id)
    const decidedStep = updated.approvalSteps.find((step) => step.id === finalStep.id)
    if (!decidedStep) {
        throw new createError.InternalServerError("Final approval step could not be reloaded")
    }

    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: true,
        completed: true,
    })
}

async function approveWithSalesDirectorBypass(request: BusinessRequestWithRelations, user: IAuthenticatedUser, note?: string | null) {
    const pendingSteps = getPendingSteps(request)
    const currentStep = pendingSteps[0]
    const salesDirectorStep = pendingSteps.find((step) => step.requiredRole === "SALES_DIRECTOR")

    if (!currentStep || !salesDirectorStep || currentStep.requiredRole !== "SALES") {
        return approveSingleStep(request, user, note)
    }

    const now = new Date()

    await prisma.$transaction(async (tx) => {
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "SKIPPED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: `Overridden by ${user.identifier}`,
            },
        })

        await tx.businessRequestApprovalStep.update({
            where: { id: salesDirectorStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: user.id,
                decidedAt: now,
                decisionNote: note?.trim() || null,
            },
        })

        const remainingPending = pendingSteps.filter((step) =>
            step.id !== currentStep.id && step.id !== salesDirectorStep.id
        )

        if (remainingPending.length === 0) {
            await applyApprovedBusinessRequestTx(tx, request)
        }

        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: remainingPending.length === 0 ? "APPROVED" : "PENDING_APPROVAL",
                decidedAt: remainingPending.length === 0 ? now : null,
                workflowTaskToken: null,
            },
        })
    })

    const updated = await loadRequestInTransaction(request.id)
    const decidedStep = updated.approvalSteps.find((step) => step.id === salesDirectorStep.id)
    if (!decidedStep) {
        throw new createError.InternalServerError("Sales director step could not be reloaded")
    }

    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: true,
        completed: updated.status === "APPROVED",
    })
}

async function updateCounterOfferPayload(input: {
    tx: PrismaTransactionClient
    request: BusinessRequestWithRelations
    user: IAuthenticatedUser
    note?: string | null
    items: CounterOfferItemInput[]
}) {
    const nowIso = new Date().toISOString()
    const requestData = asRecord(input.request.requestedData)
    const nextRound = isFiniteNumber(requestData.negotiationRound)
        ? Number(requestData.negotiationRound) + 1
        : 1
    const counterByRole = getRequesterApprovalRole(input.user)
    const existingItems = new Map(input.request.items.map((item) => [item.id, item]))

    for (const itemInput of input.items) {
        const requestItem = existingItems.get(itemInput.requestItemId)
        if (!requestItem) {
            throw new createError.BadRequest("Counter offer item does not belong to this request")
        }
    }

    for (const requestItem of input.request.items) {
        const matchingInput = input.items.find((item) => item.requestItemId === requestItem.id)
        if (!matchingInput) continue

        const currentData = asRecord(requestItem.data)

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
                } as Prisma.InputJsonValue,
            },
        })
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
            } as Prisma.InputJsonValue,
        },
    })
}

async function insertPendingCustomerStep(input: {
    tx: PrismaTransactionClient
    request: BusinessRequestWithRelations
    afterStepOrder: number
}) {
    const laterSteps = input.request.approvalSteps
        .filter((step) => step.stepOrder > input.afterStepOrder)
        .sort((left, right) => right.stepOrder - left.stepOrder)

    for (const step of laterSteps) {
        await input.tx.businessRequestApprovalStep.update({
            where: { id: step.id },
            data: {
                stepOrder: step.stepOrder + 1,
            },
        })
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
    })
}

export async function counterBusinessRequestDecision(input: {
    requestId: string
    user: IAuthenticatedUser
    note?: string | null
    counterOfferItems: CounterOfferItemInput[]
}) {
    const request = await businessRequestRepository().getRequest(input.requestId)
    if (!request) {
        throw new createError.NotFound("Business request not found")
    }

    const currentStep = getCurrentPendingStep(request)
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains")
    }

    if (!canManageSalesCounterOffer(input.user, request)) {
        throw new createError.Forbidden("Current user cannot send a counter offer for this request")
    }

    if (input.counterOfferItems.length === 0) {
        throw new createError.BadRequest("At least one counter offer item is required")
    }

    const isCustomerRound = currentStep.requiredRole === "CUSTOMER"
    if (!isCustomerRound && !canDecideBusinessRequest(input.user, request, currentStep)) {
        throw new createError.Forbidden("Current user cannot counter on this approval step")
    }

    await prisma.$transaction(async (tx) => {
        await updateCounterOfferPayload({
            tx,
            request,
            user: input.user,
            note: input.note,
            items: input.counterOfferItems,
        })

        if (isCustomerRound) {
            return
        }

        const now = new Date()
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "APPROVED",
                decidedByUserId: input.user.id,
                decidedAt: now,
                decisionNote: input.note?.trim() || "Counter offer sent to customer",
            },
        })

        await insertPendingCustomerStep({
            tx,
            request,
            afterStepOrder: currentStep.stepOrder,
        })

        await tx.businessRequest.update({
            where: { id: request.id },
            data: {
                status: "PENDING_APPROVAL",
                decidedAt: null,
                workflowTaskToken: null,
            },
        })
    })

    const updated = await loadRequestInTransaction(request.id)
    return {
        request: updated,
        shouldResumeWorkflow: !isCustomerRound,
    }
}

export async function rejectBusinessRequestDecision(input: {
    requestId: string
    user: IAuthenticatedUser
    note?: string | null
}) {
    const request = await businessRequestRepository().getRequest(input.requestId)
    if (!request) {
        throw new createError.NotFound("Business request not found")
    }

    const currentStep = getCurrentPendingStep(request)
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains")
    }

    if (!canDecideBusinessRequest(input.user, request, currentStep)) {
        throw new createError.Forbidden("Current user cannot reject this approval step")
    }

    const now = new Date()
    const pendingSteps = getPendingSteps(request)

    await prisma.$transaction(async (tx) => {
        await tx.businessRequestApprovalStep.update({
            where: { id: currentStep.id },
            data: {
                status: "REJECTED",
                decidedByUserId: input.user.id,
                decidedAt: now,
                decisionNote: input.note?.trim() || null,
            },
        })

        for (const step of pendingSteps.slice(1)) {
            await tx.businessRequestApprovalStep.update({
                where: { id: step.id },
                data: {
                    status: "SKIPPED",
                    decidedByUserId: input.user.id,
                    decidedAt: now,
                    decisionNote: `Closed after rejection by ${input.user.identifier}`,
                },
            })
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
        })
    })

    const updated = await loadRequestInTransaction(request.id)
    const decidedStep = updated.approvalSteps.find((step) => step.id === currentStep.id)
    if (!decidedStep) {
        throw new createError.InternalServerError("Rejected step could not be reloaded")
    }

    return getDecisionOutput({
        request: updated,
        decidedStep,
        approved: false,
        completed: true,
    })
}

export async function approveBusinessRequestDecision(input: {
    requestId: string
    user: IAuthenticatedUser
    note?: string | null
}) {
    const request = await businessRequestRepository().getRequest(input.requestId)
    if (!request) {
        throw new createError.NotFound("Business request not found")
    }

    const currentStep = getCurrentPendingStep(request)
    if (!currentStep) {
        throw new createError.Conflict("No pending approval step remains")
    }

    if (!canDecideBusinessRequest(input.user, request, currentStep)) {
        throw new createError.Forbidden("Current user cannot approve this approval step")
    }

    if (input.user.isOwner || input.user.isAdmin) {
        return approveWithAdminBypass(request, input.user, input.note)
    }

    if (input.user.isSalesDirector && request.domain === "SALES" && currentStep.requiredRole === "SALES") {
        return approveWithSalesDirectorBypass(request, input.user, input.note)
    }

    return approveSingleStep(request, input.user, input.note)
}

export async function createCustomerBusinessRequest(input: {
    requester: IAuthenticatedUser
    customer: CustomerDetail
    type: BusinessRequestType
    title?: string
    description?: string | null
    entityType?: BusinessRequestEntityType | null
    entityId?: string | null
    priority?: BusinessRequestPriority
    requestedData?: Record<string, unknown> | null
    items?: Array<{
        productVariantId?: string | null
        quantity?: number
        note?: string | null
        data?: Record<string, unknown> | null
    }>
}) {
    const requesterRole = getRequesterApprovalRole(input.requester)
    const domain = getBusinessRequestDomain(input.type)

    const approvalSteps = buildApprovalSteps({
        domain,
        requesterRole,
        customerAssignedSalesUserId: input.customer.assignedSalesUserId,
    })

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
        requestedData: (input.requestedData ?? {}) as Prisma.InputJsonValue,
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
        } as Prisma.InputJsonValue,
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
                        data: item.data ? item.data as Prisma.InputJsonValue : undefined,
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
    })

    return created
}

export async function createSupplierBusinessRequest(input: {
    requester: IAuthenticatedUser
    supplier: SupplierWithRelations
    type: Extract<BusinessRequestType, "SUPPLIER_PROFILE_CHANGE" | "SUPPLIER_PRICING_CHANGE" | "SUPPLIER_CAPABILITY_CHANGE" | "SUPPLIER_CATEGORY_CREATE" | "SUPPLIER_PRODUCT_CREATE" | "SUPPLIER_VARIANT_CREATE">
    title?: string
    description?: string | null
    entityType?: BusinessRequestEntityType | null
    entityId?: string | null
    priority?: BusinessRequestPriority
    requestedData?: Record<string, unknown> | null
    currentSnapshot?: Record<string, unknown> | null
    items?: Array<{
        productVariantId?: string | null
        quantity?: number
        note?: string | null
        data?: Record<string, unknown> | null
    }>
}) {
    const requesterRole = getRequesterApprovalRole(input.requester)
    const domain = getBusinessRequestDomain(input.type)

    const approvalSteps = buildApprovalSteps({
        domain,
        requesterRole,
    })

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
        requestedData: (input.requestedData ?? {}) as Prisma.InputJsonValue,
        currentSnapshot: (input.currentSnapshot ?? snapshotSupplierProfile(input.supplier)) as Prisma.InputJsonValue,
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
                        data: item.data ? item.data as Prisma.InputJsonValue : undefined,
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
    })
}

export function assertAllowedCustomerRequestType(type: BusinessRequestType) {
    const allowedTypes: BusinessRequestType[] = [
        "CUSTOMER_PROFILE_CHANGE",
        "CUSTOMER_ORDER_REQUEST",
        "CUSTOMER_DOCUMENT_REQUEST",
        "CUSTOMER_PRICING_REQUEST",
    ]

    if (!allowedTypes.includes(type)) {
        throw new createError.BadRequest("This request type cannot be created from the customer portal")
    }
}
