import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl";
export const listProductAttributeValuesHandler = ({ productAttributeValueRepository }) => {
    return async (event) => {
        const attributeId = event.pathParameters?.attributeId ??
            event.pathParameters?.id;
        if (!attributeId) {
            return apiResponseDTO({
                statusCode: 400,
                payload: { message: "attributeId (or id) path parameter is required" }
            });
        }
        const values = await productAttributeValueRepository.listValues(attributeId);
        const data = values.map((value) => ({
            ...value,
            assets: (value.assets ?? []).map((asset) => ({
                ...asset,
                url: buildAssetUrl(asset.key),
            })),
        }));
        return apiResponseDTO({
            statusCode: 200,
            payload: { data }
        });
    };
};
