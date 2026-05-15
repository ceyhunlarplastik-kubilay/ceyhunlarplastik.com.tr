import createError from "http-errors";
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listCustomerFeaturedProductsHandler = ({ customerRepository }) => {
    return async (event) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id);
        if (!customer) {
            throw new createError.NotFound("Customer not found");
        }
        const data = await customerRepository.listFeaturedProducts(customer.id);
        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: data.map((item) => ({
                    ...item,
                    product: mapProductWithAssets(item.product),
                })),
            },
        });
    };
};
