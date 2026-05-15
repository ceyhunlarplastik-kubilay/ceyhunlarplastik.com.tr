import createError from "http-errors";
import { CustomerVisitStatus } from "@/prisma/generated/prisma/enums";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const updateCustomerVisitHandler = ({ customerRepository }) => {
    return async (event) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id);
        if (!customer) {
            throw new createError.NotFound("Customer not found");
        }
        const visits = await customerRepository.listVisits(customer.id);
        const currentVisit = visits.find((visit) => visit.id === event.pathParameters.visitId);
        if (!currentVisit) {
            throw new createError.NotFound("Customer visit not found");
        }
        const body = event.body ?? {};
        const visit = await customerRepository.updateVisit(currentVisit.id, {
            ...(body.ownerUserId !== undefined ? { ownerUser: { connect: { id: body.ownerUserId } } } : {}),
            ...(body.scheduledAt !== undefined ? { scheduledAt: new Date(body.scheduledAt) } : {}),
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.note !== undefined ? { note: body.note } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.completedAt !== undefined
                ? { completedAt: body.completedAt ? new Date(body.completedAt) : null }
                : body.status === CustomerVisitStatus.COMPLETED
                    ? { completedAt: currentVisit.completedAt ?? new Date() }
                    : body.status === CustomerVisitStatus.CANCELED || body.status === CustomerVisitStatus.PLANNED
                        ? { completedAt: null }
                        : {}),
        });
        return apiResponseDTO({
            statusCode: 200,
            payload: { visit },
        });
    };
};
