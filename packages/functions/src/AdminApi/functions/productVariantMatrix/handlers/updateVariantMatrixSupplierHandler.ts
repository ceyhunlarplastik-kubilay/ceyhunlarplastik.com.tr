import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier"
import {
    applyVariantSupplierMarginVisibility,
    canManageVariantSupplierMargins,
} from "@/core/helpers/productVariants/supplierFieldVisibility"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    IUpdateVariantMatrixSupplierEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

/**
 * Bir varyantın TEDARİKÇİ satırını günceller: alış fiyatı, tedarikçi kodu, logo,
 * koli bilgisi, min sipariş, termin.
 *
 * Ölçü, renk/hammadde ve tedarikçi kimliği DEĞİŞTİRİLEMEZ — bunlar varyantın
 * kimliğini ve dolayısıyla kodunu belirler; değişimleri satırı silip yeniden
 * girmeyi gerektirir. Bu yüzden burada kod yeniden hesaplanmaz.
 */
export const updateVariantMatrixSupplierHandler = ({ productRepository }: IProductVariantMatrixDependencies) => {
    return async (event: IUpdateVariantMatrixSupplierEvent) => {
        const { id: productId, supplierRowId } = event.pathParameters
        const body = event.body

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const existing = await prisma.productVariantSupplier.findUnique({
                where: { id: supplierRowId },
                select: {
                    id: true,
                    operationalCostRate: true,
                    profitRate: true,
                    variant: { select: { productId: true } },
                },
            })
            if (!existing) throw new createError.NotFound("Variant supplier row not found")

            // Yol parametresindeki ürün ile satırın ürünü uyuşmalı: aksi hâlde bir
            // ürünün yetkisiyle başka ürünün satırı düzenlenebilirdi.
            if (existing.variant.productId !== productId) {
                throw new createError.NotFound("Variant supplier row not found for this product")
            }

            const mayManageMargins = canManageVariantSupplierMargins(event.user)

            const pricing = resolveProductVariantSupplierPricing(
                {
                    price: body.price,
                    ...(mayManageMargins
                        ? {
                            operationalCostRate: body.operationalCostRate,
                            netCost: body.netCost,
                            profitRate: body.profitRate,
                            listPrice: body.listPrice,
                        }
                        : {}),
                },
                { operationalCostRate: existing.operationalCostRate, profitRate: existing.profitRate },
            )

            const updated = await prisma.productVariantSupplier.update({
                where: { id: supplierRowId },
                data: {
                    ...pricing,
                    ...(typeof body.paymentTermDays === "number" ? { paymentTermDays: body.paymentTermDays } : {}),
                    ...(body.supplierVariantCode !== undefined
                        ? { supplierVariantCode: body.supplierVariantCode.trim() || null }
                        : {}),
                    ...(body.supplierNote !== undefined ? { supplierNote: body.supplierNote.trim() || null } : {}),
                    ...(typeof body.minOrderQty === "number" ? { minOrderQty: body.minOrderQty } : {}),
                    ...(typeof body.stockQty === "number" ? { stockQty: body.stockQty } : {}),
                    ...(body.currency ? { currency: body.currency.toUpperCase() } : {}),
                    ...(typeof body.hasSupplierLogo === "boolean" ? { hasSupplierLogo: body.hasSupplierLogo } : {}),
                    ...(typeof body.unitsPerPackage === "number" ? { unitsPerPackage: body.unitsPerPackage } : {}),
                    ...(typeof body.packageLengthMm === "number" ? { packageLengthMm: body.packageLengthMm } : {}),
                    ...(typeof body.packageWidthMm === "number" ? { packageWidthMm: body.packageWidthMm } : {}),
                    ...(typeof body.packageHeightMm === "number" ? { packageHeightMm: body.packageHeightMm } : {}),
                    ...(typeof body.packageWeightKg === "number" ? { packageWeightKg: body.packageWeightKg } : {}),
                    ...(typeof body.minLeadTimeDays === "number" ? { minLeadTimeDays: body.minLeadTimeDays } : {}),
                    ...((typeof body.minOrderQty === "number" || typeof body.stockQty === "number")
                        ? { availabilityUpdatedAt: new Date() }
                        : {}),
                },
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier: applyVariantSupplierMarginVisibility(updated, event.user) },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to update variant supplier row")
        }
    }
}
