import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
const ALLOWED_SORT_FIELDS = ["createdAt"];
export const listProductVariantSuppliersHandler = ({ productVariantSupplierRepository }) => {
    return async (event) => {
        const query = event.queryStringParameters ?? {};
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "createdAt",
        });
        try {
            const result = await productVariantSupplierRepository.listProductVariantSuppliers({
                page,
                limit,
                search,
                sort,
                order,
                ...(query.variantId && { variantId: query.variantId }),
                ...(query.supplierId && { supplierId: query.supplierId }),
            });
            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            });
        }
        catch (err) {
            console.error(err);
            throw new createError.InternalServerError("Failed to list product variant suppliers");
        }
    };
};
