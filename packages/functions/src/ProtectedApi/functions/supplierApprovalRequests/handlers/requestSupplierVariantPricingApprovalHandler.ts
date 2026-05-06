import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn"
import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    normalizeSupplierVariantPricingApprovalPayload,
    snapshotSupplierVariantPricing,
} from "@/core/helpers/supplierApproval/payloads"
import { SUPPLIER_APPROVAL_REQUEST_TYPES } from "@/core/helpers/supplierApproval/types"
import {
    IRequestSupplierVariantPricingApprovalEvent,
    ISupplierApprovalRequestDependencies,
} from "@/functions/ProtectedApi/types/supplierApprovalRequests"

const sfn = new SFNClient({})

export const requestSupplierVariantPricingApprovalHandler =
    ({ productVariantSupplierRepository, supplierApprovalRequestRepository, workflowArn }: ISupplierApprovalRequestDependencies) =>
        async (event: IRequestSupplierVariantPricingApprovalEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }
            if (!workflowArn) {
                throw new createError.InternalServerError("Approval workflow configuration is missing")
            }

            const { id } = event.pathParameters
            const existing = await productVariantSupplierRepository.getProductVariantSupplier(id)
            if (!existing) {
                throw new createError.NotFound("Variant supplier record not found")
            }

            if (existing.supplierId !== user.supplierId) {
                throw new createError.Forbidden("You can only request updates for your own supplier prices")
            }

            if (event.body.profitRate !== undefined || event.body.listPrice !== undefined) {
                throw new createError.Forbidden("You are not allowed to request profit or list price changes")
            }

            const existingPending = await supplierApprovalRequestRepository.findPendingApprovalRequest({
                type: SUPPLIER_APPROVAL_REQUEST_TYPES.VARIANT_PRICING_UPDATE,
                supplierId: user.supplierId,
                productVariantSupplierId: id,
            })

            if (existingPending) {
                throw new createError.Conflict("Bu varyant için bekleyen bir onay talebi zaten var")
            }

            const payload = normalizeSupplierVariantPricingApprovalPayload(event.body)

            const approvalRequest = await supplierApprovalRequestRepository.createApprovalRequest({
                type: SUPPLIER_APPROVAL_REQUEST_TYPES.VARIANT_PRICING_UPDATE,
                supplier: { connect: { id: user.supplierId } },
                requestedByUser: { connect: { id: user.id } },
                productVariantSupplier: { connect: { id } },
                requestPayload: payload,
                currentSnapshot: snapshotSupplierVariantPricing(existing),
            })

            try {
                const execution = await sfn.send(new StartExecutionCommand({
                    stateMachineArn: workflowArn,
                    name: `supplier-approval-${approvalRequest.id}`,
                    input: JSON.stringify({
                        requestId: approvalRequest.id,
                        type: approvalRequest.type,
                        supplierId: approvalRequest.supplierId,
                        productVariantSupplierId: approvalRequest.productVariantSupplierId,
                        requestedByUserId: approvalRequest.requestedByUserId,
                        requestedByEmail: user.email,
                    }),
                }))

                if (execution.executionArn) {
                    await supplierApprovalRequestRepository.updateWorkflowExecutionArn(
                        approvalRequest.id,
                        execution.executionArn
                    )
                }
            } catch (error) {
                await supplierApprovalRequestRepository.deleteApprovalRequest(approvalRequest.id)
                console.error(error)
                throw new createError.InternalServerError("Approval workflow could not be started")
            }

            const created = await supplierApprovalRequestRepository.getApprovalRequest(approvalRequest.id)
            if (!created) {
                throw new createError.InternalServerError("Approval request could not be loaded")
            }

            return apiResponseDTO({
                statusCode: 202,
                payload: {
                    approvalRequest: created,
                },
            })
        }
