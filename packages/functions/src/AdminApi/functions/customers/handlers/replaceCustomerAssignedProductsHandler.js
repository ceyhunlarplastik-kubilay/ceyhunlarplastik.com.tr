import createError from "http-errors";
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const replaceCustomerAssignedProductsHandler = ({ customerRepository, productRepository, }) => {
    return async (event) => {
        if (!productRepository) {
            throw new createError.InternalServerError("Product repository not configured");
        }
        const requester = event.user;
        if (!requester) {
            throw new createError.Unauthorized("Authentication required");
        }
        const customer = await customerRepository.getCustomer(event.pathParameters.id);
        if (!customer) {
            throw new createError.NotFound("Customer not found");
        }
        const productIds = Array.from(new Set((event.body?.productIds ?? []).filter(Boolean)));
        await Promise.all(productIds.map(async (productId) => {
            const product = await productRepository.getProduct(productId);
            if (!product) {
                throw new createError.NotFound("Product not found");
            }
        }));
        const data = await customerRepository.replaceAssignedProducts(customer.id, productIds, requester.id);
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
