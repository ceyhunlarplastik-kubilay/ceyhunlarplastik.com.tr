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

function mapCustomerAttributeAssignmentForApi(assignment: any) {
    if (!assignment) return assignment

    return {
        ...assignment,
        attributeValue: mapCustomerAttributeValueForApi(assignment.attributeValue),
    }
}

function mapCustomerAttributeValueForApi(value: any): any {
    if (!value) return value

    return {
        ...value,
        assets: value.assets?.map((asset: any) => ({
            ...asset,
            url: asset.url ?? buildAssetUrl(asset.key),
        })) ?? [],
        parentValue: mapCustomerAttributeValueForApi(value.parentValue),
    }
}

function mapCompanyContactAssignmentForApi(assignment: any) {
    if (!assignment) return assignment

    return {
        ...assignment,
        companyContact: assignment.companyContact ?? null,
    }
}

export function mapCustomerForApi(
    customer: any,
    options: {
        activeCompanyContactsOnly?: boolean
    } = {},
) {
    const companyContactAssignments = customer.companyContactAssignments ?? []
    const mappedCompanyContactAssignments = companyContactAssignments
        .filter((assignment: any) => {
            if (!options.activeCompanyContactsOnly) return true
            return Boolean(assignment.isActive && assignment.companyContact?.isActive)
        })
        .map(mapCompanyContactAssignmentForApi)

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
        sectorValue: mapCustomerAttributeValueForApi(customer.sectorValue),
        productionGroupValue: mapCustomerAttributeValueForApi(customer.productionGroupValue),
        usageAreaValues: customer.usageAreaValues?.map(mapCustomerAttributeValueForApi) ?? [],
        attributeValueAssignments:
            customer.attributeValueAssignments?.map(mapCustomerAttributeAssignmentForApi) ?? [],
        companyContactAssignments: mappedCompanyContactAssignments,
        portalUsers: customer.portalUsers?.map(mapCustomerUserForApi) ?? [],
        featuredProducts: customer.featuredProducts?.map(mapCustomerProductForApi),
        assignedProducts: customer.assignedProducts?.map(mapCustomerProductForApi),
        visits: customer.visits?.map(mapCustomerVisitForApi),
    }
}
