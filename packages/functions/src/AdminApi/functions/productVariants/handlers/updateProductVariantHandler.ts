import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IUpdateProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

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

export const updateProductVariantHandler = ({
    productVariantRepository,
    productRepository,
    supplierRepository,
    materialRepository,
    measurementTypeRepository,
}: IProductVariantDependencies) => {
    return async (event: IUpdateProductVariantEvent) => {

        const { id } = event.pathParameters;
        const body = event.body;
        const { suppliers, materialIds, measurements, ...cleanBody } = body;

        try {
            const existing = await productVariantRepository.getProductVariant(id);
            if (!existing) throw new createError.NotFound("Variant not found");

            let fullCode = existing.fullCode;
            const resolvedProductId = body.productId ?? existing.productId;
            const resolvedSupplierCode = body.supplierCode ?? existing.supplierCode;
            const resolvedVersionCode = body.versionCode ?? existing.versionCode;
            const resolvedVariantIndex = body.variantIndex ?? existing.variantIndex;

            // If any code component changes, rebuild fullCode
            if (body.productId || body.versionCode || body.supplierCode || body.variantIndex) {
                const product = await productRepository.getProduct(resolvedProductId);
                if (!product) throw new createError.NotFound("Product not found");
                fullCode = `${product.code}.${resolvedSupplierCode}.${resolvedVersionCode}.${resolvedVariantIndex}`;
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

            // Validate measurement types if changing
            if (measurements) {
                for (const measurement of measurements) {
                    const measurementType = await measurementTypeRepository.getMeasurementType(measurement.measurementTypeId)
                    if (!measurementType) {
                        throw new createError.NotFound(`MeasurementType ${measurement.measurementTypeId} not found`);
                    }
                }
            }

            const updated = await productVariantRepository.updateProductVariant(id, {
                ...cleanBody,
                fullCode,
                ...(suppliers && {
                    variantSuppliers: {
                        deleteMany: {},
                        create: suppliers.map((sup) => ({
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
                        })),
                    },
                }),
                ...(materialIds && {
                    materials: {
                        set: [],
                        connect: materialIds.map((materialId) => ({ id: materialId })),
                    },
                }),
                ...(measurements && {
                    measurements: {
                        deleteMany: {},
                        create: measurements.map((measurement) => ({
                            measurementType: { connect: { id: measurement.measurementTypeId } },
                            value: measurement.value,
                            label: measurement.label ?? String(measurement.value),
                        })),
                    },
                }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Variant unique constraint conflict");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update product variant");
        }
    }
}
