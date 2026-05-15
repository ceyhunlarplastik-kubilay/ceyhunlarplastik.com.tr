import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getCustomerHandler = ({ customerRepository }) => {
    return async (event) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id);
        if (!customer) {
            throw new createError.NotFound("Customer not found");
        }
        return apiResponseDTO({
            statusCode: 200,
            payload: { customer },
        });
    };
};
