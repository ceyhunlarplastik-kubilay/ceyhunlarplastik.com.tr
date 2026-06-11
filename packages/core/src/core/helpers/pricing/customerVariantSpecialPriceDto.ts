import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import {
    resolveCustomerVariantPrice,
    type ResolvedCustomerVariantPrice,
} from "@/core/helpers/pricing/customerPricing"
import { normalizeCustomerVariantPaymentSchedule } from "@/core/helpers/pricing/customerPaymentSchedule"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"

function dateToIso(value: Date | string | null | undefined) {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function mapAsset(asset: any) {
    if (!asset) return asset

    return {
        id: asset.id,
        key: asset.key,
        mimeType: asset.mimeType,
        type: asset.type,
        role: asset.role,
        url: asset.url ?? buildAssetUrl(asset.key),
        createdAt: dateToIso(asset.createdAt),
        updatedAt: dateToIso(asset.updatedAt),
    }
}

function mapUser(user: any) {
    if (!user) return null

    return {
        id: user.id,
        email: user.email,
        identifier: user.identifier,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        groups: user.groups ?? [],
    }
}

function mapMeasurement(measurement: any) {
    return {
        id: measurement.id,
        value: measurement.value,
        label: measurement.label,
        measurementType: measurement.measurementType,
    }
}

function mapProductVariantSummary(productVariant: any) {
    if (!productVariant) return null

    return {
        id: productVariant.id,
        productId: productVariant.productId,
        name: productVariant.name,
        fullCode: productVariant.fullCode,
        versionCode: productVariant.versionCode,
        supplierCode: productVariant.supplierCode,
        variantIndex: productVariant.variantIndex,
        color: productVariant.color ?? null,
        materials: productVariant.materials ?? [],
        measurements: (productVariant.measurements ?? []).map(mapMeasurement),
        assets: (productVariant.assets ?? []).map(mapAsset),
        product: productVariant.product ? mapProductWithAssets(productVariant.product) : null,
    }
}

export function mapResolvedCustomerVariantPriceForApi(resolved: ResolvedCustomerVariantPrice) {
    return {
        ...resolved,
        validFrom: dateToIso(resolved.validFrom),
        validUntil: dateToIso(resolved.validUntil),
    }
}

export function buildCustomerVariantPricingSnapshot(resolved: ResolvedCustomerVariantPrice) {
    return {
        specialPriceId: resolved.specialPriceId,
        priceSource: resolved.priceSource,
        unitPrice: resolved.finalPrice,
        listPrice: resolved.listPrice,
        currency: resolved.currency,
        minOrderQuantity: resolved.minOrderQuantity,
        maxOrderQuantity: resolved.maxOrderQuantity,
        paymentTermDays: resolved.paymentTermDays,
        paymentTermLabel: resolved.paymentTermLabel,
        paymentSchedule: resolved.paymentSchedule,
        taxIncluded: resolved.taxIncluded,
        validFrom: dateToIso(resolved.validFrom),
        validUntil: dateToIso(resolved.validUntil),
        contractReference: resolved.contractReference,
        specialPriceApplied: resolved.specialPriceApplied,
        specialPriceEligible: resolved.specialPriceEligible,
        ineligibilityReason: resolved.ineligibilityReason,
    }
}

export function mapCustomerVariantSpecialPriceForApi(
    specialPrice: any,
    options: {
        quantity?: number | null
        includeInternalNote?: boolean
    } = {},
) {
    const resolved = resolveCustomerVariantPrice({
        customer: specialPrice.customer ?? {},
        variant: specialPrice.productVariant ?? {},
        specialPrice,
        quantity: options.quantity,
    })

    return {
        id: specialPrice.id,
        customerId: specialPrice.customerId,
        productVariantId: specialPrice.productVariantId,
        price: decimalLikeToNumber(specialPrice.price) ?? null,
        currency: specialPrice.currency ?? "TRY",
        minOrderQuantity: specialPrice.minOrderQuantity ?? null,
        maxOrderQuantity: specialPrice.maxOrderQuantity ?? null,
        paymentTermDays: specialPrice.paymentTermDays ?? null,
        paymentTermLabel: specialPrice.paymentTermLabel ?? null,
        paymentSchedule: normalizeCustomerVariantPaymentSchedule(specialPrice.paymentSchedule),
        validFrom: dateToIso(specialPrice.validFrom),
        validUntil: dateToIso(specialPrice.validUntil),
        taxIncluded: Boolean(specialPrice.taxIncluded),
        deliveryTerm: specialPrice.deliveryTerm ?? null,
        contractReference: specialPrice.contractReference ?? null,
        note: specialPrice.note ?? null,
        ...(options.includeInternalNote ? { internalNote: specialPrice.internalNote ?? null } : {}),
        isActive: Boolean(specialPrice.isActive),
        createdByUserId: specialPrice.createdByUserId,
        createdByUser: mapUser(specialPrice.createdByUser),
        approvedByUserId: specialPrice.approvedByUserId ?? null,
        approvedByUser: mapUser(specialPrice.approvedByUser),
        approvedAt: dateToIso(specialPrice.approvedAt),
        createdAt: dateToIso(specialPrice.createdAt),
        updatedAt: dateToIso(specialPrice.updatedAt),
        customer: specialPrice.customer
            ? {
                id: specialPrice.customer.id,
                fullName: specialPrice.customer.fullName,
                companyName: specialPrice.customer.companyName ?? null,
                generalDiscountPercent: decimalLikeToNumber(specialPrice.customer.generalDiscountPercent) ?? null,
                assignedSalesUserId: specialPrice.customer.assignedSalesUserId ?? null,
            }
            : null,
        productVariant: mapProductVariantSummary(specialPrice.productVariant),
        pricing: mapResolvedCustomerVariantPriceForApi(resolved),
    }
}
