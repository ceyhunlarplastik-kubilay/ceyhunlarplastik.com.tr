import createError from "http-errors"
import { mapCustomerForApi } from "@/core/helpers/crm/mapCustomerForApi"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { buildCustomerUpdateData } from "@/core/helpers/crm/customerUpdateData"
import { buildAuditContextFromEvent } from "@/core/helpers/audit/auditContext"
import { ICustomerDependencies, IUpdateCustomerEvent } from "@/functions/AdminApi/types/customers"

export const updateCustomerHandler = ({
    customerRepository,
    productAttributeValueRepository,
}: ICustomerDependencies) => {
    return async (event: IUpdateCustomerEvent) => {
        const requester = event.user
        if (!requester || (!requester.isOwner && !requester.isAdmin && !requester.isSalesDirector && !requester.isSales)) {
            throw new createError.Forbidden("Customer update access denied")
        }

        if (!productAttributeValueRepository) {
            throw new createError.InternalServerError("Product attribute value repository not configured")
        }

        const existing = await customerRepository.getCustomer(event.pathParameters.id)
        if (!existing) {
            throw new createError.NotFound("Customer not found")
        }

        const data = await buildCustomerUpdateData(productAttributeValueRepository, event.body ?? {}, {
            currentPhone: existing.phone,
        })
        // Müşteri alanları ve iletişim kişisi ataması TEK transaction'da (+ denetim kaydı):
        // eskiden iki ayrı yazmaydı, ikincisi düşerse ilki kalıyordu.
        const customer = await customerRepository.updateCustomer(existing.id, data, buildAuditContextFromEvent(event), {
            companyContactAssignments: event.body?.companyContactAssignments,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(customer) },
        })
    }
}
