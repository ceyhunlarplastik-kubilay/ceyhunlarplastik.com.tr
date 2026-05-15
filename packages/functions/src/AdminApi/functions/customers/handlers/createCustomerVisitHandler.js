import createError from "http-errors";
import { CustomerVisitStatus } from "@/prisma/generated/prisma/enums";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const createCustomerVisitHandler = ({ customerRepository }) => {
    return async (event) => {
        const requester = event.user;
        if (!requester) {
            throw new createError.Unauthorized("Authentication required");
        }
        const customer = await customerRepository.getCustomer(event.pathParameters.id);
        if (!customer) {
            throw new createError.NotFound("Customer not found");
        }
        const visit = await customerRepository.createVisit({
            customer: { connect: { id: customer.id } },
            ownerUser: { connect: { id: event.body.ownerUserId } },
            createdByUser: { connect: { id: requester.id } },
            scheduledAt: new Date(event.body.scheduledAt),
            title: event.body.title,
            note: event.body.note ?? null,
            status: event.body.status ?? CustomerVisitStatus.PLANNED,
            ...(event.body.status === CustomerVisitStatus.COMPLETED ? { completedAt: new Date() } : {}),
        });
        return apiResponseDTO({
            statusCode: 201,
            payload: { visit },
        });
    };
};
