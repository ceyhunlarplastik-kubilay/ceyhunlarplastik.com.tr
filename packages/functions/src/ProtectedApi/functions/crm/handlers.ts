import createError from "http-errors"
import { CustomerVisitStatus } from "@/prisma/generated/prisma/enums"
import { Prisma } from "@/prisma/generated/prisma/client"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import { mapCustomerForApi } from "@/core/helpers/crm/mapCustomerForApi"
import { getCustomerFeaturedAndMatchedProducts } from "@/core/helpers/crm/getCustomerFeaturedAndMatchedProducts"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import {
    assertCustomerManagementAccess,
    assertCustomerPortalAccess,
    assertSupplierManagementAccess,
} from "@/core/helpers/crm/access"
import { buildCustomerUpdateData } from "@/core/helpers/crm/customerUpdateData"
import { normalizeCompanyContactAssignments } from "@/core/helpers/crm/companyContactAssignments"
import { mapCustomerVariantSpecialPriceForApi } from "@/core/helpers/pricing/customerVariantSpecialPriceDto"
import {
    formatCustomerVariantPaymentScheduleLabel,
    normalizeCustomerVariantPaymentSchedule,
} from "@/core/helpers/pricing/customerPaymentSchedule"
import {
    ICreateManagedCustomerSpecialPriceEvent,
    ICreatePortalCustomerAddressEvent,
    ICreateManagedCustomerVisitEvent,
    IDeleteManagedCustomerVisitEvent,
    ICustomerSpecialPriceBody,
    IListManagedCustomerSpecialPricesEvent,
    IListManagedCustomersEvent,
    IListManagedSuppliersEvent,
    IManagedCustomerSpecialPriceEvent,
    IManagedCustomerEvent,
    IManagedSupplierEvent,
    IPortalCustomerSpecialPricesEvent,
    IProtectedCrmDependencies,
    IReplaceManagedCustomerAssignedProductsEvent,
    IReplaceManagedCustomerFeaturedProductsEvent,
    IUpdateManagedCustomerSpecialPriceEvent,
    IUpdateManagedCustomerEvent,
    IUpdateManagedCustomerVisitEvent,
} from "@/functions/ProtectedApi/types/crm"

const CUSTOMER_SORT_FIELDS = ["fullName", "companyName", "email", "createdAt"] as const
const SUPPLIER_SORT_FIELDS = ["name", "createdAt"] as const

function mapFeaturedProducts(data: Array<any>) {
    return data.map((item) => ({
        ...item,
        product: mapProductWithAssets(item.product),
    }))
}

function parseBooleanQuery(value: unknown) {
    if (value === "true" || value === true) return true
    if (value === "false" || value === false) return false
    return undefined
}

function textOrNull(value: string | null | undefined) {
    if (value === undefined) return undefined
    const normalized = value?.trim()
    return normalized || null
}

function dateOrNull(value: string | null | undefined) {
    if (value === undefined) return undefined
    if (!value?.trim()) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date
}

function resolvePaymentTermLabel(days: number | null | undefined, label: string | null | undefined) {
    const normalizedLabel = textOrNull(label)
    if (normalizedLabel !== undefined) return normalizedLabel
    if (days === undefined) return undefined
    if (days === null) return null
    return days === 0 ? "Peşin" : `${days} Gün`
}

function normalizePaymentScheduleForPersistence(value: ICustomerSpecialPriceBody["paymentSchedule"]) {
    return normalizeCustomerVariantPaymentSchedule(value) ?? null
}

function buildSpecialPriceCreateData(
    customerId: string,
    createdByUserId: string,
    body: ICreateManagedCustomerSpecialPriceEvent["body"],
) {
    const paymentSchedule = normalizePaymentScheduleForPersistence(body.paymentSchedule)

    return {
        customer: { connect: { id: customerId } },
        productVariant: { connect: { id: body.productVariantId } },
        price: body.price,
        currency: body.currency?.trim() || "TRY",
        minOrderQuantity: body.minOrderQuantity ?? null,
        maxOrderQuantity: body.maxOrderQuantity ?? null,
        paymentTermDays: paymentSchedule?.length ? null : body.paymentTermDays ?? null,
        paymentTermLabel: paymentSchedule?.length
            ? formatCustomerVariantPaymentScheduleLabel(paymentSchedule, "Çok adımlı ödeme")
            : resolvePaymentTermLabel(body.paymentTermDays, body.paymentTermLabel) ?? null,
        paymentSchedule: paymentSchedule ?? Prisma.JsonNull,
        validFrom: dateOrNull(body.validFrom) ?? null,
        validUntil: dateOrNull(body.validUntil) ?? null,
        taxIncluded: body.taxIncluded ?? false,
        deliveryTerm: textOrNull(body.deliveryTerm) ?? null,
        contractReference: textOrNull(body.contractReference) ?? null,
        note: textOrNull(body.note) ?? null,
        internalNote: textOrNull(body.internalNote) ?? null,
        isActive: body.isActive ?? true,
        createdByUser: { connect: { id: createdByUserId } },
    }
}

function buildSpecialPriceUpdateData(body: ICustomerSpecialPriceBody) {
    const data: Record<string, unknown> = {}

    if (body.productVariantId !== undefined) {
        data.productVariant = { connect: { id: body.productVariantId } }
    }
    if (body.price !== undefined) data.price = body.price
    if (body.currency !== undefined) data.currency = body.currency.trim() || "TRY"
    if (body.minOrderQuantity !== undefined) data.minOrderQuantity = body.minOrderQuantity
    if (body.maxOrderQuantity !== undefined) data.maxOrderQuantity = body.maxOrderQuantity
    if (body.paymentSchedule !== undefined) {
        const paymentSchedule = normalizePaymentScheduleForPersistence(body.paymentSchedule)
        data.paymentSchedule = paymentSchedule ?? Prisma.JsonNull
        if (paymentSchedule?.length) {
            data.paymentTermDays = null
            data.paymentTermLabel = formatCustomerVariantPaymentScheduleLabel(paymentSchedule, "Çok adımlı ödeme")
        } else {
            if (body.paymentTermDays !== undefined) data.paymentTermDays = body.paymentTermDays
            if (body.paymentTermDays !== undefined || body.paymentTermLabel !== undefined) {
                data.paymentTermLabel = resolvePaymentTermLabel(body.paymentTermDays, body.paymentTermLabel)
            }
        }
    }
    if (body.paymentSchedule === undefined && body.paymentTermDays !== undefined) data.paymentTermDays = body.paymentTermDays
    if (
        body.paymentSchedule === undefined
        && (body.paymentTermDays !== undefined || body.paymentTermLabel !== undefined)
    ) {
        data.paymentTermLabel = resolvePaymentTermLabel(body.paymentTermDays, body.paymentTermLabel)
    }
    if (body.validFrom !== undefined) data.validFrom = dateOrNull(body.validFrom)
    if (body.validUntil !== undefined) data.validUntil = dateOrNull(body.validUntil)
    if (body.taxIncluded !== undefined) data.taxIncluded = body.taxIncluded
    if (body.deliveryTerm !== undefined) data.deliveryTerm = textOrNull(body.deliveryTerm)
    if (body.contractReference !== undefined) data.contractReference = textOrNull(body.contractReference)
    if (body.note !== undefined) data.note = textOrNull(body.note)
    if (body.internalNote !== undefined) data.internalNote = textOrNull(body.internalNote)
    if (body.isActive !== undefined) data.isActive = body.isActive

    return data
}

export const listManagedCustomersHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IListManagedCustomersEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: CUSTOMER_SORT_FIELDS,
            defaultSort: "createdAt",
        })

        const result = await customerRepository.listCustomers({
            page,
            limit,
            search,
            sort,
            order,
            sectorValueId: event.queryStringParameters?.sectorValueId,
            productionGroupValueId: event.queryStringParameters?.productionGroupValueId,
            usageAreaValueId: event.queryStringParameters?.usageAreaValueId,
            status: event.queryStringParameters?.status,
            assignedSalesUserId: requester.isOwner || requester.isAdmin
                ? event.queryStringParameters?.assignedSalesUserId
                : requester.id,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: result.data.map((customer) => mapCustomerForApi(customer)),
                meta: result.meta,
            },
        })
    }
}

export const listManagedCompanyContactsHandler = ({ companyContactRepository }: IProtectedCrmDependencies) => {
    return async () => {
        if (!companyContactRepository) {
            throw new createError.InternalServerError("Company contact repository not configured")
        }

        const data = await companyContactRepository.listActiveCompanyContacts()

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data,
                meta: {
                    page: 1,
                    limit: data.length,
                    total: data.length,
                    totalPages: 1,
                },
            },
        })
    }
}

export const getManagedCustomerHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(customer) },
        })
    }
}

export const updateManagedCustomerHandler = ({
    customerRepository,
    productAttributeValueRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IUpdateManagedCustomerEvent) => {
        const requester = event.user
        if (!requester || (!requester.isOwner && !requester.isAdmin && !requester.isSalesDirector && !requester.isSales)) {
            throw new createError.Forbidden("Customer update access denied")
        }

        if (!productAttributeValueRepository) {
            throw new createError.InternalServerError("Product attribute value repository not configured")
        }

        const existing = await customerRepository.getCustomer(event.pathParameters.id)
        if (!existing) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, existing)

        const data = await buildCustomerUpdateData(productAttributeValueRepository, event.body ?? {})
        const updated = await customerRepository.updateCustomer(existing.id, data)
        const customer = event.body?.companyContactAssignments !== undefined
            ? await customerRepository.replaceCompanyContactAssignments(
                existing.id,
                normalizeCompanyContactAssignments(event.body.companyContactAssignments),
            )
            : updated

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(customer) },
        })
    }
}

export const convertManagedCustomerHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const updated = await customerRepository.convertCustomer(customer.id, requester.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(updated) },
        })
    }
}

export const listManagedCustomerFeaturedProductsHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const data = await customerRepository.listFeaturedProducts(customer.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data: mapFeaturedProducts(data) },
        })
    }
}

export const replaceManagedCustomerFeaturedProductsHandler = ({
    customerRepository,
    productRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IReplaceManagedCustomerFeaturedProductsEvent) => {
        if (!productRepository) {
            throw new createError.InternalServerError("Product repository not configured")
        }
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const productIds = Array.from(new Set((event.body?.productIds ?? []).filter(Boolean)))
        await Promise.all(productIds.map((productId) => productRepository.getProduct(productId)))

        const data = await customerRepository.replaceFeaturedProducts(customer.id, productIds, requester.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data: mapFeaturedProducts(data) },
        })
    }
}

export const listManagedCustomerAssignedProductsHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const data = await customerRepository.listAssignedProducts(customer.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data: mapFeaturedProducts(data) },
        })
    }
}

export const replaceManagedCustomerAssignedProductsHandler = ({
    customerRepository,
    productRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IReplaceManagedCustomerAssignedProductsEvent) => {
        if (!productRepository) {
            throw new createError.InternalServerError("Product repository not configured")
        }
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const productIds = Array.from(new Set((event.body?.productIds ?? []).filter(Boolean)))
        await Promise.all(productIds.map((productId) => productRepository.getProduct(productId)))

        const data = await customerRepository.replaceAssignedProducts(customer.id, productIds, requester.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data: mapFeaturedProducts(data) },
        })
    }
}

export const listManagedCustomerSpecialPricesHandler = ({
    customerRepository,
    customerVariantSpecialPriceRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IListManagedCustomerSpecialPricesEvent) => {
        if (!customerVariantSpecialPriceRepository) {
            throw new createError.InternalServerError("Customer special price repository not configured")
        }

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
            allowedSortFields: ["createdAt", "updatedAt", "validUntil", "price"],
            defaultSort: "createdAt",
        })

        const result = await customerVariantSpecialPriceRepository.listSpecialPrices({
            page,
            limit,
            search,
            sort,
            order,
            customerId: customer.id,
            isActive: parseBooleanQuery(event.queryStringParameters?.isActive),
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: result.data.map((specialPrice) =>
                    mapCustomerVariantSpecialPriceForApi(specialPrice, { includeInternalNote: true }),
                ),
                meta: result.meta,
            },
        })
    }
}

export const getManagedCustomerSpecialPriceHandler = ({
    customerRepository,
    customerVariantSpecialPriceRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerSpecialPriceEvent) => {
        if (!customerVariantSpecialPriceRepository) {
            throw new createError.InternalServerError("Customer special price repository not configured")
        }

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const specialPrice = await customerVariantSpecialPriceRepository.getSpecialPrice(event.pathParameters.specialPriceId)
        if (!specialPrice || specialPrice.customerId !== customer.id) {
            throw new createError.NotFound("Customer special price not found")
        }

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                specialPrice: mapCustomerVariantSpecialPriceForApi(specialPrice, { includeInternalNote: true }),
            },
        })
    }
}

export const createManagedCustomerSpecialPriceHandler = ({
    customerRepository,
    productVariantRepository,
    customerVariantSpecialPriceRepository,
}: IProtectedCrmDependencies) => {
    return async (event: ICreateManagedCustomerSpecialPriceEvent) => {
        if (!productVariantRepository || !customerVariantSpecialPriceRepository) {
            throw new createError.InternalServerError("Customer special price dependencies not configured")
        }

        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const variant = await productVariantRepository.getProductVariant(event.body.productVariantId)
        if (!variant) throw new createError.NotFound("Product variant not found")

        const duplicate = await customerVariantSpecialPriceRepository.getByCustomerAndVariant(
            customer.id,
            event.body.productVariantId,
        )
        if (duplicate) {
            throw new createError.Conflict("This customer already has a special price for this product variant")
        }

        const created = await customerVariantSpecialPriceRepository.createSpecialPrice(
            buildSpecialPriceCreateData(customer.id, requester.id, event.body),
        )

        return apiResponseDTO({
            statusCode: 201,
            payload: {
                specialPrice: mapCustomerVariantSpecialPriceForApi(created, { includeInternalNote: true }),
            },
        })
    }
}

export const updateManagedCustomerSpecialPriceHandler = ({
    customerRepository,
    productVariantRepository,
    customerVariantSpecialPriceRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IUpdateManagedCustomerSpecialPriceEvent) => {
        if (!productVariantRepository || !customerVariantSpecialPriceRepository) {
            throw new createError.InternalServerError("Customer special price dependencies not configured")
        }

        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const existing = await customerVariantSpecialPriceRepository.getSpecialPrice(event.pathParameters.specialPriceId)
        if (!existing || existing.customerId !== customer.id) {
            throw new createError.NotFound("Customer special price not found")
        }

        if (event.body.productVariantId && event.body.productVariantId !== existing.productVariantId) {
            const variant = await productVariantRepository.getProductVariant(event.body.productVariantId)
            if (!variant) throw new createError.NotFound("Product variant not found")

            const duplicate = await customerVariantSpecialPriceRepository.getByCustomerAndVariant(
                customer.id,
                event.body.productVariantId,
            )
            if (duplicate && duplicate.id !== existing.id) {
                throw new createError.Conflict("This customer already has a special price for this product variant")
            }
        }

        const updated = await customerVariantSpecialPriceRepository.updateSpecialPrice(
            existing.id,
            buildSpecialPriceUpdateData(event.body),
        )

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                specialPrice: mapCustomerVariantSpecialPriceForApi(updated, { includeInternalNote: true }),
            },
        })
    }
}

export const deactivateManagedCustomerSpecialPriceHandler = ({
    customerRepository,
    customerVariantSpecialPriceRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerSpecialPriceEvent) => {
        if (!customerVariantSpecialPriceRepository) {
            throw new createError.InternalServerError("Customer special price repository not configured")
        }

        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const existing = await customerVariantSpecialPriceRepository.getSpecialPrice(event.pathParameters.specialPriceId)
        if (!existing || existing.customerId !== customer.id) {
            throw new createError.NotFound("Customer special price not found")
        }

        const updated = await customerVariantSpecialPriceRepository.deactivateSpecialPrice(existing.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                specialPrice: mapCustomerVariantSpecialPriceForApi(updated, { includeInternalNote: true }),
            },
        })
    }
}

export const listManagedCustomerVisitsHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const data = await customerRepository.listVisits(customer.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data },
        })
    }
}

export const createManagedCustomerVisitHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: ICreateManagedCustomerVisitEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(requester, customer)

        const visit = await customerRepository.createVisit({
            customer: { connect: { id: customer.id } },
            ownerUser: { connect: { id: event.body.ownerUserId } },
            createdByUser: { connect: { id: requester.id } },
            scheduledAt: new Date(event.body.scheduledAt),
            title: event.body.title,
            note: event.body.note ?? null,
            status: event.body.status ?? CustomerVisitStatus.PLANNED,
            ...(event.body.status === CustomerVisitStatus.COMPLETED ? { completedAt: new Date() } : {}),
        })

        return apiResponseDTO({
            statusCode: 201,
            payload: { visit },
        })
    }
}

export const updateManagedCustomerVisitHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IUpdateManagedCustomerVisitEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const visits = await customerRepository.listVisits(customer.id)
        const currentVisit = visits.find((visit) => visit.id === event.pathParameters.visitId)
        if (!currentVisit) throw new createError.NotFound("Customer visit not found")

        const body = event.body ?? {}
        const visit = await customerRepository.updateVisit(currentVisit.id, {
            ...(body.ownerUserId !== undefined ? { ownerUser: { connect: { id: body.ownerUserId } } } : {}),
            ...(body.scheduledAt !== undefined ? { scheduledAt: new Date(body.scheduledAt) } : {}),
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.note !== undefined ? { note: body.note } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.completedAt !== undefined
                ? { completedAt: body.completedAt ? new Date(body.completedAt) : null }
                : body.status === CustomerVisitStatus.COMPLETED
                    ? { completedAt: currentVisit.completedAt ?? new Date() }
                    : body.status === CustomerVisitStatus.CANCELED || body.status === CustomerVisitStatus.PLANNED
                        ? { completedAt: null }
                        : {}),
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: { visit },
        })
    }
}

export const deleteManagedCustomerVisitHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IDeleteManagedCustomerVisitEvent) => {
        const customer = await customerRepository.getCustomer(event.pathParameters.id)
        if (!customer) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, customer)

        const visits = await customerRepository.listVisits(customer.id)
        const currentVisit = visits.find((visit) => visit.id === event.pathParameters.visitId)
        if (!currentVisit) throw new createError.NotFound("Customer visit not found")

        const visit = await customerRepository.deleteVisit(currentVisit.id)

        return apiResponseDTO({
            statusCode: 200,
            payload: { visit },
        })
    }
}

export const listManagedSuppliersHandler = ({ supplierRepository }: IProtectedCrmDependencies) => {
    return async (event: IListManagedSuppliersEvent) => {
        const requester = event.user
        if (!requester) throw new createError.Unauthorized("Authentication required")

        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: SUPPLIER_SORT_FIELDS,
            defaultSort: "createdAt",
        })

        const result = await supplierRepository.listSuppliers({
            page,
            limit,
            search,
            sort,
            order,
            assignedPurchasingUserId: requester.isOwner || requester.isAdmin
                ? event.queryStringParameters?.assignedPurchasingUserId
                : requester.id,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: result.data,
                meta: result.meta,
            },
        })
    }
}

export const getManagedSupplierHandler = ({ supplierRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedSupplierEvent) => {
        const supplier = await supplierRepository.getSupplier(event.pathParameters.id)
        if (!supplier) throw new createError.NotFound("Supplier not found")

        assertSupplierManagementAccess(event.user, supplier)

        return apiResponseDTO({
            statusCode: 200,
            payload: { supplier },
        })
    }
}

export const getPortalCustomerHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customerId = event.user?.customerId
        if (!customerId) throw new createError.Forbidden("Customer portal access denied")

        assertCustomerPortalAccess(event.user, customerId)

        const customer = await customerRepository.getCustomer(customerId)
        if (!customer) throw new createError.NotFound("Customer not found")

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(customer) },
        })
    }
}

export const listPortalCustomerSpecialPricesHandler = ({
    customerVariantSpecialPriceRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IPortalCustomerSpecialPricesEvent) => {
        if (!customerVariantSpecialPriceRepository) {
            throw new createError.InternalServerError("Customer special price repository not configured")
        }

        const customerId = event.user?.customerId
        if (!customerId) throw new createError.Forbidden("Customer portal access denied")

        assertCustomerPortalAccess(event.user, customerId)

        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
            allowedSortFields: ["createdAt", "updatedAt", "validUntil", "price"],
            defaultSort: "createdAt",
        })

        const result = await customerVariantSpecialPriceRepository.listSpecialPrices({
            page,
            limit,
            search,
            sort,
            order,
            customerId,
            isActive: true,
            currentOnly: true,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: result.data.map((specialPrice) =>
                    mapCustomerVariantSpecialPriceForApi(specialPrice, { includeInternalNote: false }),
                ),
                meta: result.meta,
            },
        })
    }
}

export const createPortalCustomerAddressHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: ICreatePortalCustomerAddressEvent) => {
        const customerId = event.user?.customerId
        if (!customerId) throw new createError.Forbidden("Customer portal access denied")

        assertCustomerPortalAccess(event.user, customerId)

        const customer = await customerRepository.getCustomer(customerId)
        if (!customer) throw new createError.NotFound("Customer not found")

        const updated = await customerRepository.createAddress(customer.id, {
            label: event.body.label.trim(),
            contactName: event.body.contactName?.trim() || null,
            phone: event.body.phone?.trim() || null,
            email: event.body.email?.trim() || null,
            countryId: event.body.countryId ?? null,
            stateId: event.body.stateId ?? null,
            cityId: event.body.cityId ?? null,
            country: event.body.country?.trim() || "Turkiye",
            city: event.body.city.trim(),
            district: event.body.district?.trim() || null,
            line1: event.body.line1.trim(),
            line2: event.body.line2?.trim() || null,
            postalCode: event.body.postalCode?.trim() || null,
            taxOffice: event.body.taxOffice?.trim() || null,
            taxNumber: event.body.taxNumber?.trim() || null,
            isPrimary: event.body.isPrimary,
            isBilling: event.body.isBilling,
            isShipping: event.body.isShipping,
            note: event.body.note?.trim() || null,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer: mapCustomerForApi(updated) },
        })
    }
}

export const getPortalCustomerFeaturedProductsHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customerId = event.user?.customerId
        if (!customerId) throw new createError.Forbidden("Customer portal access denied")

        assertCustomerPortalAccess(event.user, customerId)

        const data = await getCustomerFeaturedAndMatchedProducts(customerId)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data: mapFeaturedProducts(data) },
        })
    }
}

export const getPortalCustomerAssignedProductsHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customerId = event.user?.customerId
        if (!customerId) throw new createError.Forbidden("Customer portal access denied")

        assertCustomerPortalAccess(event.user, customerId)

        const data = await customerRepository.listAssignedProducts(customerId)

        return apiResponseDTO({
            statusCode: 200,
            payload: { data: mapFeaturedProducts(data) },
        })
    }
}
