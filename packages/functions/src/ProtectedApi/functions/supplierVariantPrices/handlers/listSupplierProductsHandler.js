import createError from "http-errors";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
const ALLOWED_SORT_FIELDS = ["name", "code", "createdAt", "updatedAt"];
export const listSupplierProductsHandler = ({ productVariantSupplierRepository }) => async (event) => {
    const user = event.user;
    if (!user)
        throw new createError.Forbidden("User context missing");
    const query = event.queryStringParameters ?? {};
    const { page, limit, search, sort, order } = normalizeListQuery(query, {
        allowedSortFields: ALLOWED_SORT_FIELDS,
        defaultSort: "name",
    });
    const supplierId = user.supplierId ?? query.supplierId;
    if (!supplierId && user.isSupplier && !user.isOwner && !user.isAdmin) {
        throw new createError.Forbidden("Supplier context missing");
    }
    const result = await productVariantSupplierRepository.listProductsBySupplier({
        supplierId,
        page,
        limit,
        search,
        sort,
        order,
        ...(query.categoryId && { categoryId: query.categoryId }),
    });
    return apiResponseDTO({
        statusCode: 200,
        payload: result,
    });
};
