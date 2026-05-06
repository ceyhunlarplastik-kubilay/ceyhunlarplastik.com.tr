import createError from "http-errors"
import { supplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { buildApprovedVariantPricingUpdate } from "@/core/helpers/supplierApproval/variantPricing"
import { normalizeSupplierProfileApprovalPayload } from "@/core/helpers/supplierApproval/payloads"
import type {
    SupplierProfileApprovalPayload,
    SupplierVariantPricingApprovalPayload,
} from "@/core/helpers/supplierApproval/types"

type ResolveDecisionInput = {
    requestId: string
    reviewerUserId: string
    note?: string | null
}

export async function approveSupplierApprovalRequest({
    requestId,
    reviewerUserId,
    note,
}: ResolveDecisionInput) {
    const approvalRepository = supplierApprovalRequestRepository()
    const request = await approvalRepository.getApprovalRequest(requestId)

    if (!request) {
        throw new createError.NotFound("Approval request not found")
    }

    if (request.status !== "PENDING") {
        return request
    }

    if (request.type === "SUPPLIER_PROFILE_UPDATE") {
        await supplierRepository().updateSupplier(
            request.supplierId,
            normalizeSupplierProfileApprovalPayload(request.requestPayload as SupplierProfileApprovalPayload)
        )
    }

    if (request.type === "VARIANT_PRICING_UPDATE") {
        if (!request.productVariantSupplierId) {
            throw new createError.BadRequest("Variant pricing request target is missing")
        }

        const existing = await productVariantSupplierRepository().getProductVariantSupplier(request.productVariantSupplierId)
        if (!existing) {
            throw new createError.NotFound("Variant supplier record not found")
        }

        const payload = request.requestPayload as SupplierVariantPricingApprovalPayload
        await productVariantSupplierRepository().updateProductVariantSupplier(
            request.productVariantSupplierId,
            buildApprovedVariantPricingUpdate(existing, payload)
        )
    }

    return approvalRepository.resolveApprovalRequest(request.id, {
        status: "APPROVED",
        reviewedByUserId: reviewerUserId,
        decisionNote: note?.trim() || null,
        decidedAt: new Date(),
    })
}

export async function rejectSupplierApprovalRequest({
    requestId,
    reviewerUserId,
    note,
}: ResolveDecisionInput) {
    const repository = supplierApprovalRequestRepository()
    const request = await repository.getApprovalRequest(requestId)

    if (!request) {
        throw new createError.NotFound("Approval request not found")
    }

    if (request.status !== "PENDING") {
        return request
    }

    return repository.resolveApprovalRequest(request.id, {
        status: "REJECTED",
        reviewedByUserId: reviewerUserId,
        decisionNote: note?.trim() || null,
        decidedAt: new Date(),
    })
}
