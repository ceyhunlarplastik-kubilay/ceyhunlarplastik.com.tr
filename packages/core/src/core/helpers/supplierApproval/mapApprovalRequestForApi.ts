import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"

export function mapApprovalRequestForApi<T extends Record<string, any>>(request: T): T {
    const product = request.productVariantSupplier?.variant?.product

    if (!product) return request

    return {
        ...request,
        productVariantSupplier: {
            ...request.productVariantSupplier,
            variant: {
                ...request.productVariantSupplier.variant,
                product: mapProductWithAssets(product),
            },
        },
    }
}
