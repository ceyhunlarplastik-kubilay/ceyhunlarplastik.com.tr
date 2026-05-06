import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn"
import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    normalizeSupplierProfileApprovalPayload,
    snapshotSupplierProfile,
} from "@/core/helpers/supplierApproval/payloads"
import { SUPPLIER_APPROVAL_REQUEST_TYPES } from "@/core/helpers/supplierApproval/types"
import {
    IRequestSupplierProfileApprovalEvent,
    ISupplierApprovalRequestDependencies,
} from "@/functions/ProtectedApi/types/supplierApprovalRequests"

const sfn = new SFNClient({})

export const requestSupplierProfileApprovalHandler =
    ({ supplierApprovalRequestRepository, supplierRepository, workflowArn }: ISupplierApprovalRequestDependencies) =>
        async (event: IRequestSupplierProfileApprovalEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }
            if (!workflowArn) {
                throw new createError.InternalServerError("Approval workflow configuration is missing")
            }

            const payload = normalizeSupplierProfileApprovalPayload(event.body ?? {})
            if (Object.keys(payload).length === 0) {
                throw new createError.BadRequest("At least one field must be provided")
            }

            const existingPending = await supplierApprovalRequestRepository.findPendingApprovalRequest({
                type: SUPPLIER_APPROVAL_REQUEST_TYPES.SUPPLIER_PROFILE_UPDATE,
                supplierId: user.supplierId,
            })

            if (existingPending) {
                throw new createError.Conflict("Bu tedarikçi profili için bekleyen bir onay talebi zaten var")
            }

            const supplier = await supplierRepository.getSupplier(user.supplierId)
            if (!supplier) {
                throw new createError.NotFound("Supplier profile not found")
            }
            const approvalRequest = await supplierApprovalRequestRepository.createApprovalRequest({
                type: SUPPLIER_APPROVAL_REQUEST_TYPES.SUPPLIER_PROFILE_UPDATE,
                supplier: { connect: { id: user.supplierId } },
                requestedByUser: { connect: { id: user.id } },
                requestPayload: payload,
                currentSnapshot: snapshotSupplierProfile(supplier),
            })

            try {
                const execution = await sfn.send(new StartExecutionCommand({
                    stateMachineArn: workflowArn,
                    name: `supplier-approval-${approvalRequest.id}`,
                    input: JSON.stringify({
                        requestId: approvalRequest.id,
                        type: approvalRequest.type,
                        supplierId: approvalRequest.supplierId,
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
