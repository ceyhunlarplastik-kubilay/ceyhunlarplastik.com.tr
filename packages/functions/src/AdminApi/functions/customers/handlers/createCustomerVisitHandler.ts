import createError from "http-errors"
import { CustomerVisitStatus } from "@/prisma/generated/prisma/enums"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICreateCustomerVisitEvent, ICustomerDependencies } from "@/functions/AdminApi/types/customers"

export const createCustomerVisitHandler = ({ customerRepository }: ICustomerDependencies) => {
    return async (event: ICreateCustomerVisitEvent) => {
        const requester = event.user
        if (!requester) {
            throw new createError.Unauthorized("Authentication required")
        }

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) {
            throw new createError.NotFound("Customer not found")
        }

        const visit = await customerRepository.createVisit({
            customer: { connect: { id: customer.id } },
            ownerUser: { connect: { id: event.body.ownerUserId } },
            ...(event.body.addressId ? { address: { connect: { id: event.body.addressId } } } : {}),
            createdByUser: { connect: { id: requester.id } },
            scheduledAt: new Date(event.body.scheduledAt),
            title: event.body.title,
            note: event.body.note ?? null,
            status: event.body.status ?? CustomerVisitStatus.PLANNED,
            ...(event.body.type ? { type: event.body.type } : {}),
            ...(event.body.outcome !== undefined ? { outcome: event.body.outcome } : {}),
            ...(event.body.nextActionAt !== undefined
                ? { nextActionAt: event.body.nextActionAt ? new Date(event.body.nextActionAt) : null }
                : {}),
            ...(event.body.status === CustomerVisitStatus.COMPLETED ? { completedAt: new Date() } : {}),
        })

        return apiResponseDTO({
            statusCode: 201,
            payload: { visit },
        })
    }
}
