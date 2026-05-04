import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, ICreateProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

function resolvePricingFields(supplierInput: {
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
}) {
    const hasPrice = typeof supplierInput.price === "number" && Number.isFinite(supplierInput.price)
    const hasOperationalRate =
        typeof supplierInput.operationalCostRate === "number" && Number.isFinite(supplierInput.operationalCostRate)
    const hasNetCost = typeof supplierInput.netCost === "number" && Number.isFinite(supplierInput.netCost)
    const hasProfitRate = typeof supplierInput.profitRate === "number" && Number.isFinite(supplierInput.profitRate)
    const hasListPrice = typeof supplierInput.listPrice === "number" && Number.isFinite(supplierInput.listPrice)

    const result: {
        price?: number
        operationalCostRate?: number
        netCost?: number
        profitRate?: number
        listPrice?: number
    } = {}

    if (hasPrice) result.price = supplierInput.price
    if (hasOperationalRate) result.operationalCostRate = supplierInput.operationalCostRate
    if (hasProfitRate) result.profitRate = supplierInput.profitRate
    if (hasListPrice) result.listPrice = supplierInput.listPrice
    if (hasNetCost) result.netCost = supplierInput.netCost

    const resolvedNetCost =
        hasNetCost
            ? supplierInput.netCost!
            : hasPrice
                ? supplierInput.price! * (1 + (supplierInput.operationalCostRate ?? 0) / 100)
                : undefined

    if (resolvedNetCost !== undefined) {
        result.netCost = resolvedNetCost
    }

    const shouldRecomputeListPriceFromProfit =
        hasProfitRate && resolvedNetCost !== undefined && (hasPrice || hasOperationalRate || hasNetCost)

    if (shouldRecomputeListPriceFromProfit) {
        result.listPrice = resolvedNetCost! * (1 + supplierInput.profitRate! / 100)
    } else if (!hasListPrice && hasProfitRate && resolvedNetCost !== undefined) {
        result.listPrice = resolvedNetCost * (1 + supplierInput.profitRate! / 100)
    } else if (!hasProfitRate && hasListPrice && resolvedNetCost !== undefined && resolvedNetCost > 0) {
        result.profitRate = ((supplierInput.listPrice! - resolvedNetCost) / resolvedNetCost) * 100
    }

    if (hasPrice || hasOperationalRate || hasNetCost || hasProfitRate || hasListPrice) {
        ; (result as any).pricingUpdatedAt = new Date()
    }

    return result
}

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
                            ...resolvePricingFields({
                                price: sup.price,
                                operationalCostRate: sup.operationalCostRate,
                                netCost: sup.netCost,
                                profitRate: sup.profitRate,
                                listPrice: sup.listPrice,
                            }),
                            ...(typeof sup.paymentTermDays === "number" ? { paymentTermDays: sup.paymentTermDays } : {}),
                            ...(sup.supplierVariantCode ? { supplierVariantCode: sup.supplierVariantCode.trim() } : {}),
                            ...(sup.supplierNote ? { supplierNote: sup.supplierNote.trim() } : {}),
                            ...(typeof sup.minOrderQty === "number" ? { minOrderQty: sup.minOrderQty } : {}),
                            ...(typeof sup.stockQty === "number" ? { stockQty: sup.stockQty } : {}),
                            ...((typeof sup.minOrderQty === "number" || typeof sup.stockQty === "number")
                                ? { availabilityUpdatedAt: new Date() }
                                : {}),
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
