import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    ISupplierVariantPriceDependencies,
    IUpdateSupplierVariantPriceEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"

export const updateSupplierVariantPriceHandler =
    ({ productVariantSupplierRepository }: ISupplierVariantPriceDependencies) =>
        async (event: IUpdateSupplierVariantPriceEvent) => {
            const decimalLikeToNumber = (value: unknown): number | undefined => {
                if (value === null || value === undefined) return undefined
                if (typeof value === "number" && Number.isFinite(value)) return value
                if (typeof value === "string") {
                    const parsed = Number(value)
                    return Number.isFinite(parsed) ? parsed : undefined
                }
                if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as any).toNumber === "function") {
                    const parsed = (value as any).toNumber()
                    return Number.isFinite(parsed) ? parsed : undefined
                }
                const parsed = Number(value as any)
                return Number.isFinite(parsed) ? parsed : undefined
            }

            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { id } = event.pathParameters
            const {
                price,
                operationalCostRate,
                netCost,
                profitRate,
                listPrice,
                paymentTermDays,
                supplierVariantCode,
                supplierNote,
                minOrderQty,
                stockQty,
                currency,
            } = event.body

            const existing = await productVariantSupplierRepository.getProductVariantSupplier(id)
            if (!existing) throw new createError.NotFound("Variant supplier record not found")

            const canBypassSupplierOwnership = user.isOwner || user.isAdmin || user.isPurchasing
            const canManageAdvancedPricing = user.isOwner || user.isAdmin

            if (!canBypassSupplierOwnership && (!user.isSupplier || !user.supplierId)) {
                throw new createError.Forbidden("Supplier context missing")
            }

            if (!canBypassSupplierOwnership && existing.supplierId !== user.supplierId) {
                throw new createError.Forbidden("You can only update your own supplier prices")
            }

            if (!canManageAdvancedPricing && (profitRate !== undefined || listPrice !== undefined)) {
                throw new createError.Forbidden("You are not allowed to update profit or list price")
            }

            const hasOperationalRate =
                typeof operationalCostRate === "number" && Number.isFinite(operationalCostRate)
            const hasNetCost = typeof netCost === "number" && Number.isFinite(netCost)
            const hasProfitRate = typeof profitRate === "number" && Number.isFinite(profitRate)
            const hasListPrice = typeof listPrice === "number" && Number.isFinite(listPrice)

            const existingOperationalRate = decimalLikeToNumber((existing as any).operationalCostRate) ?? 0
            const resolvedOperationalRate = hasOperationalRate ? operationalCostRate : existingOperationalRate

            const resolvedNetCost =
                hasNetCost
                    ? netCost
                    : price * (1 + (resolvedOperationalRate ?? 0) / 100)

            let resolvedProfitRate: number | undefined = hasProfitRate ? profitRate : undefined
            let resolvedListPrice: number | undefined = hasListPrice ? listPrice : undefined

            const shouldRecomputeListPriceFromProfit =
                hasProfitRate && (hasOperationalRate || hasNetCost)

            if (shouldRecomputeListPriceFromProfit) {
                resolvedListPrice = resolvedNetCost * (1 + (profitRate / 100))
            } else if (!hasListPrice && hasProfitRate) {
                resolvedListPrice = resolvedNetCost * (1 + (profitRate / 100))
            } else if (hasListPrice && !hasProfitRate && resolvedNetCost > 0) {
                resolvedProfitRate = ((listPrice - resolvedNetCost) / resolvedNetCost) * 100
            } else if (!hasListPrice && !hasProfitRate) {
                const existingProfitRate = decimalLikeToNumber((existing as any).profitRate)
                if (existingProfitRate !== undefined) {
                    resolvedProfitRate = existingProfitRate
                    resolvedListPrice = resolvedNetCost * (1 + (existingProfitRate / 100))
                }
            }

            const updated = await productVariantSupplierRepository.updateProductVariantSupplier(id, {
                price,
                operationalCostRate: resolvedOperationalRate,
                netCost: resolvedNetCost,
                ...(resolvedProfitRate !== undefined ? { profitRate: resolvedProfitRate } : {}),
                ...(resolvedListPrice !== undefined ? { listPrice: resolvedListPrice } : {}),
                ...(typeof paymentTermDays === "number" ? { paymentTermDays } : {}),
                ...(supplierVariantCode !== undefined ? { supplierVariantCode: supplierVariantCode.trim() } : {}),
                ...(supplierNote !== undefined ? { supplierNote: supplierNote.trim() } : {}),
                ...(typeof minOrderQty === "number" ? { minOrderQty } : {}),
                ...(typeof stockQty === "number" ? { stockQty } : {}),
                ...((typeof minOrderQty === "number" || typeof stockQty === "number")
                    ? { availabilityUpdatedAt: new Date() }
                    : {}),
                ...(currency && { currency: currency.toUpperCase() }),
                pricingUpdatedAt: new Date(),
            } as any)

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariantSupplier: updated },
            })
        }
