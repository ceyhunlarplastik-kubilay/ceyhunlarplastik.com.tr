import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { mapApprovalRequestForApi } from "@/core/helpers/supplierApproval/mapApprovalRequestForApi"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IAdminSupplierApprovalRequestDependencies, IListAdminSupplierApprovalRequestsEvent } from "@/functions/AdminApi/types/supplierApprovalRequests"

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "decidedAt", "status", "type"] as const
const ALLOWED_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"])
const ALLOWED_TYPES = new Set(["SUPPLIER_PROFILE_UPDATE", "VARIANT_PRICING_UPDATE"])

export const listSupplierApprovalRequestsHandler =
    ({ supplierApprovalRequestRepository }: IAdminSupplierApprovalRequestDependencies) =>
        async (event: IListAdminSupplierApprovalRequestsEvent) => {
            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "createdAt",
            })

            const status = event.queryStringParameters?.status
            const type = event.queryStringParameters?.type
            const supplierId = event.queryStringParameters?.supplierId

            const result = await supplierApprovalRequestRepository.listApprovalRequests({
                page,
                limit,
                search,
                sort,
                order,
                ...(status && ALLOWED_STATUSES.has(status) ? { status } : {}),
                ...(type && ALLOWED_TYPES.has(type) ? { type } : {}),
                ...(supplierId ? { supplierId } : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map(mapApprovalRequestForApi),
                    meta: result.meta,
                },
            })
        }
