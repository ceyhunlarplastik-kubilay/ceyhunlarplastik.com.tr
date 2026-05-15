import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const listAttributesWithValuesHandler = ({ productAttributeRepository, }) => {
    return async (_event) => {
        // _event → unused param ama type consistency korunur ✅
        try {
            const data = await productAttributeRepository.listAttributesForFilter();
            return apiResponseDTO({
                statusCode: 200,
                payload: { data },
            });
        }
        catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to list attributes with values");
        }
    };
};
