import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import { normalizeCustomerDiscountPercent } from "@/core/helpers/pricing/customerPricing"

function mapCustomerUserForApi(user: any) {
    if (!user) return user

    return {
        ...user,
        imageUrl: user.imageKey ? buildAssetUrl(user.imageKey) : null,
    }
}

function mapCustomerProductForApi(item: any) {
    if (!item) return item

    return {
        ...item,
        createdByUser: mapCustomerUserForApi(item.createdByUser),
        product: item.product ? mapProductWithAssets(item.product) : item.product,
    }
}

function mapCustomerVisitForApi(visit: any) {
    if (!visit) return visit

    return {
        ...visit,
        ownerUser: mapCustomerUserForApi(visit.ownerUser),
        createdByUser: mapCustomerUserForApi(visit.createdByUser),
    }
}

export function mapCustomerForApi(customer: any) {
    return {
        ...customer,
        generalDiscountPercent: normalizeCustomerDiscountPercent(customer.generalDiscountPercent),
        defaultPaymentTermDays:
            typeof customer.defaultPaymentTermDays === "number"
                ? customer.defaultPaymentTermDays
                : customer.defaultPaymentTermDays ?? null,
        creditLimit: decimalLikeToNumber(customer.creditLimit) ?? null,
        assignedSalesUser: mapCustomerUserForApi(customer.assignedSalesUser),
        convertedByUser: mapCustomerUserForApi(customer.convertedByUser),
        portalUsers: customer.portalUsers?.map(mapCustomerUserForApi) ?? [],
        featuredProducts: customer.featuredProducts?.map(mapCustomerProductForApi),
        assignedProducts: customer.assignedProducts?.map(mapCustomerProductForApi),
        visits: customer.visits?.map(mapCustomerVisitForApi),
    }
}
