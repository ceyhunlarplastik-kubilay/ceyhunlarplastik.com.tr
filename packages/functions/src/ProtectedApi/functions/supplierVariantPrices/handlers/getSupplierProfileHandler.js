import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getSupplierProfileHandler = ({ supplierRepository }) => async (event) => {
    const user = event.user;
    if (!user)
        throw new createError.Forbidden("User context missing");
    if (!user.supplierId) {
        return apiResponseDTO({
            statusCode: 200,
            payload: { supplier: null },
        });
    }
    const supplier = await supplierRepository.getSupplier(user.supplierId);
    return apiResponseDTO({
        statusCode: 200,
        payload: { supplier },
    });
};
