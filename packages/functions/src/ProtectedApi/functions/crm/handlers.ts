import createError from "http-errors"
import { CustomerVisitStatus } from "@/prisma/generated/prisma/enums"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import {
    assertCustomerManagementAccess,
    assertCustomerPortalAccess,
    assertSupplierManagementAccess,
} from "@/core/helpers/crm/access"
import { buildCustomerUpdateData } from "@/core/helpers/crm/customerUpdateData"
import {
    ICreateManagedCustomerVisitEvent,
    IDeleteManagedCustomerVisitEvent,
    IListManagedCustomersEvent,
    IListManagedSuppliersEvent,
    IManagedCustomerEvent,
    IManagedSupplierEvent,
    IProtectedCrmDependencies,
    IReplaceManagedCustomerAssignedProductsEvent,
    IReplaceManagedCustomerFeaturedProductsEvent,
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
                data: result.data,
                meta: result.meta,
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
            payload: { customer },
        })
    }
}

export const updateManagedCustomerHandler = ({
    customerRepository,
    productAttributeValueRepository,
}: IProtectedCrmDependencies) => {
    return async (event: IUpdateManagedCustomerEvent) => {
        if (!productAttributeValueRepository) {
            throw new createError.InternalServerError("Product attribute value repository not configured")
        }

        const existing = await customerRepository.getCustomer(event.pathParameters.id)
        if (!existing) throw new createError.NotFound("Customer not found")

        assertCustomerManagementAccess(event.user, existing)

        const data = await buildCustomerUpdateData(productAttributeValueRepository, event.body ?? {})
        const customer = await customerRepository.updateCustomer(existing.id, data)

        return apiResponseDTO({
            statusCode: 200,
            payload: { customer },
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
            payload: { customer: updated },
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
            payload: { customer },
        })
    }
}

export const getPortalCustomerFeaturedProductsHandler = ({ customerRepository }: IProtectedCrmDependencies) => {
    return async (event: IManagedCustomerEvent) => {
        const customerId = event.user?.customerId
        if (!customerId) throw new createError.Forbidden("Customer portal access denied")

        assertCustomerPortalAccess(event.user, customerId)

        const data = await customerRepository.listFeaturedProducts(customerId)

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
