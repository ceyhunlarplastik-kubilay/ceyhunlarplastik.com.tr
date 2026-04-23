import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, ICreateProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

export const createProductVariantHandler = ({ productVariantRepository, productRepository, supplierRepository, materialRepository }: IProductVariantDependencies) => {
    return async (event: ICreateProductVariantEvent) => {
        const { productId, variantIndex, suppliers, versionCode, supplierCode, name, colorId, materialIds, measurements } = event.body;

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found");

            // Validate all suppliers and ensure single active supplier
            let activeSupplierCount = 0;
            if (suppliers) {
                for (const sup of suppliers) {
                    const supplier = await supplierRepository.getSupplier(sup.id)
                    if (!supplier) throw new createError.NotFound(`Supplier ${sup.id} not found`);
                    if (sup.isActive) activeSupplierCount++;
                }

                if (activeSupplierCount > 1) {
                    throw new createError.BadRequest("Only one supplier can be active for a variant");
                }
            }

            // Generate fullCode: <ProductCode>.<SupplierCode>.<VersionCode>.<VariantIndex>
            // e.g. 1.9.A.V1.1
            const fullCode = `${product.code}.${supplierCode}.${versionCode}.${variantIndex}`;

            const variant = await productVariantRepository.createProductVariant({
                product: { connect: { id: productId } },
                versionCode,
                supplierCode,
                variantIndex,
                fullCode,
                name,
                ...(colorId && { color: { connect: { id: colorId } } }),
                ...(materialIds && materialIds.length > 0 && {
                    materials: {
                        connect: materialIds.map(id => ({ id }))
                    }
                }),
                // Connect product variant suppliers
                ...(suppliers && suppliers.length > 0 && {
                    variantSuppliers: {
                        create: suppliers.map(sup => ({
                            supplier: { connect: { id: sup.id } },
                            isActive: sup.isActive ?? false,
                            ...(sup.price !== undefined && { price: sup.price }),
                            ...(sup.currency && { currency: sup.currency.toUpperCase() }),
                        }))
                    }
                }),
                // Create measurements inline
                ...(measurements && measurements.length > 0 && {
                    measurements: {
                        create: measurements.map((m: { measurementTypeId: string; value: number; label: string }) => ({
                            measurementType: { connect: { id: m.measurementTypeId } },
                            value: m.value,
                            label: m.label,
                        }))
                    }
                })
            })

            return apiResponseDTO({
                statusCode: 201,
                payload: { productVariant: variant },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Variant identifier (code) already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create product variant");
        }
    }
}
