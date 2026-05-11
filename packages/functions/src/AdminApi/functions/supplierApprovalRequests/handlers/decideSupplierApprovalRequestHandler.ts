import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn"
import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    approveSupplierApprovalRequest,
    rejectSupplierApprovalRequest,
} from "@/core/helpers/supplierApproval/decision"
import { mapApprovalRequestForApi } from "@/core/helpers/supplierApproval/mapApprovalRequestForApi"
import { IAdminSupplierApprovalRequestDependencies, IDecideSupplierApprovalRequestEvent } from "@/functions/AdminApi/types/supplierApprovalRequests"

const sfn = new SFNClient({})

export const decideSupplierApprovalRequestHandler =
    ({ supplierApprovalRequestRepository }: IAdminSupplierApprovalRequestDependencies) =>
        async (event: IDecideSupplierApprovalRequestEvent) => {
            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { id } = event.pathParameters
            const { approved, note } = event.body

            const request = await supplierApprovalRequestRepository.getApprovalRequest(id)
            if (!request) {
                throw new createError.NotFound("Approval request not found")
            }

            if (request.status !== "PENDING") {
                throw new createError.Conflict("Bu talep zaten sonuçlandırılmış")
            }

            if (!request.workflowTaskToken) {
                throw new createError.Conflict("Talebin workflow task token bilgisi bulunamadı")
            }

            const approvalRequest = approved
                ? await approveSupplierApprovalRequest({
                    requestId: request.id,
                    reviewerUserId: user.id,
                    note,
                })
                : await rejectSupplierApprovalRequest({
                    requestId: request.id,
                    reviewerUserId: user.id,
                    note,
                })

            try {
                await sfn.send(new SendTaskSuccessCommand({
                    taskToken: request.workflowTaskToken,
                    output: JSON.stringify({
                        requestId: request.id,
                        type: request.type,
                        supplierId: request.supplierId,
                        productVariantSupplierId: request.productVariantSupplierId,
                        approved,
                        reviewedByUserId: user.id,
                        reviewerEmail: user.email,
                        note: note?.trim() || null,
                    }),
                }))
            } catch (error) {
                console.error(error)
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    accepted: true,
                    approvalRequest: mapApprovalRequestForApi(approvalRequest),
                },
            })
        }
