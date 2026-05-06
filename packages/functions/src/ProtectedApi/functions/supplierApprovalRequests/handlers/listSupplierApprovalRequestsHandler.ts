import createError from "http-errors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IListSupplierApprovalRequestsEvent, ISupplierApprovalRequestDependencies } from "@/functions/ProtectedApi/types/supplierApprovalRequests"

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "decidedAt", "status", "type"] as const
const ALLOWED_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"])
const ALLOWED_TYPES = new Set(["SUPPLIER_PROFILE_UPDATE", "VARIANT_PRICING_UPDATE"])

export const listSupplierApprovalRequestsHandler =
    ({ supplierApprovalRequestRepository }: ISupplierApprovalRequestDependencies) =>
        async (event: IListSupplierApprovalRequestsEvent) => {
            const user = event.user
            if (!user?.supplierId || !user.isSupplier) {
                throw new createError.Forbidden("Supplier context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "createdAt",
            })

            const status = event.queryStringParameters?.status
            const type = event.queryStringParameters?.type

            const result = await supplierApprovalRequestRepository.listApprovalRequests({
                page,
                limit,
                search,
                sort,
                order,
                supplierId: user.supplierId,
                ...(status && ALLOWED_STATUSES.has(status) ? { status } : {}),
                ...(type && ALLOWED_TYPES.has(type) ? { type } : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            })
        }
