import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import { normalizeCustomerDiscountPercent } from "@/core/helpers/pricing/customerPricing"
import { buildUserDisplayName } from "@/core/helpers/users/displayName"

function resolveCustomerPortalInvitation(user: any) {
    const invitation = Array.isArray(user?.customerInvitations) ? user.customerInvitations[0] : null
    const isPendingInvitation = Boolean(invitation && !invitation.acceptedAt)

    return {
        invitation,
        isPendingInvitation,
    }
}

function mapCustomerUserForApi(user: any) {
    if (!user) return user

    const { customerInvitations, ...rest } = user
    const { invitation, isPendingInvitation } = resolveCustomerPortalInvitation(user)
    const firstName = isPendingInvitation
        ? invitation.requestedFirstName ?? user.firstName ?? null
        : user.firstName ?? null
    const lastName = isPendingInvitation
        ? invitation.requestedLastName ?? user.lastName ?? null
        : user.lastName ?? null
    const customerContactTitle = isPendingInvitation
        ? invitation.requestedCustomerContactTitle ?? user.customerContactTitle ?? null
        : user.customerContactTitle ?? null
    const customerContactDepartment = isPendingInvitation
        ? invitation.requestedCustomerContactDepartment ?? user.customerContactDepartment ?? null
        : user.customerContactDepartment ?? null
    const isPrimaryCustomerContact = isPendingInvitation
        ? Boolean(invitation.requestedIsPrimaryCustomerContact)
        : Boolean(user.isPrimaryCustomerContact)

    return {
        ...rest,
        identifier: buildUserDisplayName({
            firstName,
            lastName,
            identifier: user.identifier,
            email: user.email,
        }) || user.identifier,
        firstName,
        lastName,
        customerContactTitle,
        customerContactDepartment,
        isPrimaryCustomerContact,
        portalOnboardingState: isPendingInvitation ? "INVITED" : "ACTIVE",
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

function mapCustomerVariantMeasurementForApi(measurement: any) {
    if (!measurement) return measurement

    return {
        ...measurement,
        measurementType: measurement.measurementType ?? null,
    }
}

function mapCustomerAssignedProductVariantSummaryForApi(productVariant: any) {
    if (!productVariant) return productVariant

    return {
        ...productVariant,
        color: productVariant.color ?? null,
        materials: productVariant.materials ?? [],
        measurements: (productVariant.measurements ?? []).map(mapCustomerVariantMeasurementForApi),
        assets: (productVariant.assets ?? []).map((asset: any) => ({
            ...asset,
            url: asset.url ?? buildAssetUrl(asset.key),
        })),
        product: productVariant.product ? mapProductWithAssets(productVariant.product) : null,
    }
}

export function mapCustomerAssignedProductForApi(item: any) {
    if (!item) return item

    return {
        ...item,
        createdByUser: mapCustomerUserForApi(item.createdByUser),
        productVariant: mapCustomerAssignedProductVariantSummaryForApi(item.productVariant),
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

function mapCustomerAddressForApi(address: any) {
    if (!address) return address

    return {
        ...address,
        latitude: decimalLikeToNumber(address.latitude) ?? null,
        longitude: decimalLikeToNumber(address.longitude) ?? null,
        locationVerifiedByUser: mapCustomerUserForApi(address.locationVerifiedByUser),
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
        assignedProducts: customer.assignedProducts?.map(mapCustomerAssignedProductForApi),
        addresses: customer.addresses?.map(mapCustomerAddressForApi) ?? [],
        visits: customer.visits?.map(mapCustomerVisitForApi),
    }
}
