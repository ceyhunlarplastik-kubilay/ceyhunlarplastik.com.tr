import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listCustomerVisitsHandler = ({ customerRepository }) => {
    return async (event) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id);
        if (!customer) {
            throw new createError.NotFound("Customer not found");
        }
        const data = await customerRepository.listVisits(customer.id);
        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        });
    };
};
