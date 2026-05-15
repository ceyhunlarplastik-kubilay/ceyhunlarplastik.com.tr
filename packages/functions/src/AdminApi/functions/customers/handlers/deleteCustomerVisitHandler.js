import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const deleteCustomerVisitHandler = ({ customerRepository }) => {
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
        const visit = await customerRepository.deleteVisit(currentVisit.id);
        return apiResponseDTO({
            statusCode: 200,
            payload: { visit },
        });
    };
};
