import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IUpdateProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

export const updateProductVariantHandler = ({ productVariantRepository, productRepository, supplierRepository, materialRepository }: IProductVariantDependencies) => {
    return async (event: IUpdateProductVariantEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;
        const { suppliers, materialIds, ...cleanBody } = body;

        const existing = await productVariantRepository.getProductVariant(id);
        if (!existing) throw new createError.NotFound("Variant not found");

        let fullCode = existing.fullCode;

        // If productId, versionCode, or supplierCode changes, update fullCode
        if (body.productId || body.versionCode || body.supplierCode) {
            const product = await productRepository.getProduct(body.productId ?? existing.productId);
            if (!product) throw new createError.NotFound("Product not found");
            const resolvedSupplierCode = body.supplierCode ?? existing.supplierCode;
            const resolvedVersionCode = body.versionCode ?? existing.versionCode;
            fullCode = `${product.code}.${resolvedSupplierCode}.${resolvedVersionCode}.${existing.variantIndex}`;
        }

        // Validate Suppliers if changing
        if (suppliers) {
            let activeSupplierCount = 0;
            for (const sup of suppliers) {
                const supplier = await supplierRepository.getSupplier(sup.id)
                if (!supplier) throw new createError.NotFound(`Supplier ${sup.id} not found`);
                if (sup.isActive) activeSupplierCount++;
            }

            if (activeSupplierCount > 1) {
                throw new createError.BadRequest("Only one supplier can be active for a variant");
            }
        }

        // Validate Materials if changing
        if (materialIds) {
            for (const matId of materialIds) {
                const mat = await materialRepository.getMaterial(matId)
                if (!mat) throw new createError.NotFound(`Material ${matId} not found`);
            }
        }

        const updated = await productVariantRepository.updateProductVariant(id, {
            ...cleanBody,
            fullCode,
            ...(suppliers && {
                variantSuppliers: {
                    deleteMany: {}, // Remove all existing connections
                    create: suppliers.map(sup => ({
                        supplier: { connect: { id: sup.id } },
                        isActive: sup.isActive ?? false
                    }))
                }
            }),
            ...(materialIds && {
                materials: {
                    set: [],
                    connect: materialIds.map(id => ({ id }))
                }
            }),
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: { productVariant: updated },
        })
    }
}
