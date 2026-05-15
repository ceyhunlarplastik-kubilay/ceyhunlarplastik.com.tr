import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { generateProductAttributeValueAssetUpload } from "@/core/helpers/s3/presign";
export const createProductAttributeValueAssetUploadHandler = ({ productAttributeValueRepository, }) => {
    return async (event) => {
        const { productAttributeValueId, assetRole, fileName, contentType } = event.body;
        if (!productAttributeValueId || !assetRole || !fileName || !contentType) {
            throw new createError.BadRequest("Missing required fields");
        }
        const value = await productAttributeValueRepository.getValueById(productAttributeValueId);
        if (!value) {
            throw new createError.NotFound("Product attribute value not found");
        }
        const presigned = await generateProductAttributeValueAssetUpload({
            attributeCode: value.attribute.code,
            valueSlug: value.slug,
            assetRole,
            fileName,
            contentType,
        });
        return apiResponseDTO({
            statusCode: 200,
            payload: presigned,
        });
    };
};
