import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { normalizeCustomerDiscountPercent } from "@/core/helpers/pricing/customerPricing"

function mapUser(user: any) {
    if (!user) return user

    return {
        ...user,
        imageUrl: user.imageKey ? buildAssetUrl(user.imageKey) : null,
    }
}

export function mapOrderForApi(order: any) {
    return {
        ...order,
        discountPercent: normalizeCustomerDiscountPercent(order.discountPercent),
        listSubtotal: decimalLikeToNumber(order.listSubtotal),
        customerSubtotal: decimalLikeToNumber(order.customerSubtotal),
        customer: order.customer
            ? {
                ...order.customer,
                assignedSalesUser: mapUser(order.customer.assignedSalesUser),
            }
            : null,
        requestedByUser: mapUser(order.requestedByUser),
        items: (order.items ?? []).map((item: any) => ({
            ...item,
            listUnitPrice: decimalLikeToNumber(item.listUnitPrice),
            customerUnitPrice: decimalLikeToNumber(item.customerUnitPrice),
            listLineTotal: decimalLikeToNumber(item.listLineTotal),
            customerLineTotal: decimalLikeToNumber(item.customerLineTotal),
            productVariant: item.productVariant
                ? {
                    ...item.productVariant,
                    product: item.productVariant.product
                        ? mapProductWithAssets(item.productVariant.product)
                        : item.productVariant.product,
                }
                : null,
        })),
    }
}
