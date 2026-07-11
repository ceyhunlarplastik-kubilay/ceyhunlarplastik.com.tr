import { mapAsset } from "@/core/helpers/assets/mapProductWithAssets"

/**
 * Public/portal varyant tablosu satırını güvenli DTO'ya indirger.
 *
 * variantSuppliers'tan yalnız liste fiyatı ve tedarikçi künyesi taşınır;
 * tedarikçi maliyeti (price), netCost, profitRate, operationalCostRate,
 * paymentTermDays, supplierNote, supplierVariantCode, minOrderQty ve stockQty
 * iç ticari veridir ve public yanıtına çıkmamalıdır. Müşteri portalının
 * liste fiyatı gösterimi (resolveMinListPrice) listPrice + currency +
 * pricingUpdatedAt alanlarına dayandığı için bunlar korunur.
 */
export function mapPublicProductVariantTableRow(variant: any) {
    return {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        versionCode: variant.versionCode,
        supplierCode: variant.supplierCode,
        variantIndex: variant.variantIndex,
        fullCode: variant.fullCode,
        colorId: variant.colorId ?? null,
        color: variant.color ?? null,
        materials: (variant.materials ?? []).map((material: any) => ({
            id: material.id,
            name: material.name,
            code: material.code ?? null,
            assets: (material.assets ?? []).map(mapAsset),
        })),
        measurements: (variant.measurements ?? []).map((measurement: any) => ({
            id: measurement.id,
            value: measurement.value,
            label: measurement.label ?? "",
            measurementType: measurement.measurementType,
        })),
        variantSuppliers: (variant.variantSuppliers ?? []).map((item: any) => ({
            id: item.id,
            isActive: item.isActive,
            currency: item.currency ?? null,
            listPrice: item.listPrice ?? null,
            pricingUpdatedAt: item.pricingUpdatedAt ?? null,
            updatedAt: item.updatedAt,
            supplier: item.supplier
                ? { id: item.supplier.id, name: item.supplier.name }
                : null,
        })),
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
    }
}
