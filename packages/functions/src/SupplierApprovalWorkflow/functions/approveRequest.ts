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

    if (!event.approved) {
        throw new createError.BadRequest("Approved event expected")
    }

    const approvalRepository = supplierApprovalRequestRepository()
    const request = await approvalRepository.getApprovalRequest(event.requestId)

    if (!request) {
        throw new createError.NotFound("Approval request not found")
    }

    if (request.status !== "PENDING") {
        return request
    }

    if (request.type === "SUPPLIER_PROFILE_UPDATE") {
        const supplier = await supplierRepository().updateSupplier(
            request.supplierId,
            normalizeSupplierProfileApprovalPayload(request.requestPayload as SupplierProfileApprovalPayload)
        )
        void supplier
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
        reviewedByUserId: event.reviewerUserId,
        decisionNote: event.note?.trim() || null,
        decidedAt: new Date(),
    })
}
