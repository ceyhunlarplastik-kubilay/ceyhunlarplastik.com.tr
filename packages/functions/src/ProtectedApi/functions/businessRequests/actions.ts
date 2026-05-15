import { lambdaHandler } from "@/core/middy"
import { businessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { colorRepository } from "@/core/helpers/prisma/colors/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { materialRepository } from "@/core/helpers/prisma/materials/repository"
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import {
    createSupplierBusinessRequestHandler,
    createPortalBusinessRequestHandler,
    decideBusinessRequestHandler,
    getSupplierVariantRequestReferencesHandler,
    listPortalBusinessRequestsHandler,
    listPurchasingBusinessRequestsHandler,
    listSalesBusinessRequestsHandler,
    listSupplierBusinessRequestsHandler,
    requestSupplierProfileBusinessRequestHandler,
    requestSupplierVariantPricingBusinessRequestHandler,
} from "@/functions/ProtectedApi/functions/businessRequests/handlers"
import type {
    ICreatePortalBusinessRequestEvent,
    ICreateSupplierBusinessRequestEvent,
    IDecideBusinessRequestEvent,
    IGetSupplierVariantRequestReferencesEvent,
    IListPortalBusinessRequestsEvent,
    IListSupplierBusinessRequestsEvent,
    IRequestSupplierProfileBusinessRequestEvent,
    IRequestSupplierVariantPricingBusinessRequestEvent,
} from "@/functions/ProtectedApi/types/businessRequests"
import {
    businessRequestDecisionResponseValidator,
    businessRequestListResponseValidator,
    businessRequestResponseValidator,
    createPortalBusinessRequestValidator,
    createSupplierBusinessRequestValidator,
    decideBusinessRequestValidator,
    listBusinessRequestsValidator,
} from "@/functions/AdminApi/validators/businessRequests"
import {
    updateSupplierProfileValidator,
    updateSupplierVariantPriceValidator,
} from "@/functions/ProtectedApi/validators/supplierVariantPrices"

const deps = {
    businessRequestRepository: businessRequestRepository(),
    customerRepository: customerRepository(),
    supplierRepository: supplierRepository(),
    categoryRepository: categoryRepository(),
    productRepository: productRepository(),
    productVariantSupplierRepository: productVariantSupplierRepository(),
    materialRepository: materialRepository(),
    measurementTypeRepository: measurementTypeRepository(),
    colorRepository: colorRepository(),
    workflowArn: process.env.BUSINESS_APPROVAL_WORKFLOW_ARN ?? "",
}

export const listPortalBusinessRequests = lambdaHandler(
    async (event) => listPortalBusinessRequestsHandler(deps)(event as IListPortalBusinessRequestsEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: listBusinessRequestsValidator,
        responseValidator: businessRequestListResponseValidator,
    },
)

export const createPortalBusinessRequest = lambdaHandler(
    async (event) => createPortalBusinessRequestHandler(deps)(event as ICreatePortalBusinessRequestEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: createPortalBusinessRequestValidator,
        responseValidator: businessRequestResponseValidator,
    },
)

export const listSalesBusinessRequests = lambdaHandler(
    async (event) => listSalesBusinessRequestsHandler(deps)(event as IListPortalBusinessRequestsEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: listBusinessRequestsValidator,
        responseValidator: businessRequestListResponseValidator,
    },
)

export const listPurchasingBusinessRequests = lambdaHandler(
    async (event) => listPurchasingBusinessRequestsHandler(deps)(event as IListPortalBusinessRequestsEvent),
    {
        auth: { requiredPermissionGroups: ["purchasing", "admin", "owner"] },
        requestValidator: listBusinessRequestsValidator,
        responseValidator: businessRequestListResponseValidator,
    },
)

export const listSupplierBusinessRequests = lambdaHandler(
    async (event) => listSupplierBusinessRequestsHandler(deps)(event as IListSupplierBusinessRequestsEvent),
    {
        auth: { requiredPermissionGroups: ["supplier", "admin", "owner"] },
        requestValidator: listBusinessRequestsValidator,
        responseValidator: businessRequestListResponseValidator,
    },
)

export const requestSupplierProfileBusinessRequest = lambdaHandler(
    async (event) => requestSupplierProfileBusinessRequestHandler(deps)(event as IRequestSupplierProfileBusinessRequestEvent),
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        requestValidator: updateSupplierProfileValidator,
        responseValidator: businessRequestResponseValidator,
    },
)

export const requestSupplierVariantPricingBusinessRequest = lambdaHandler(
    async (event) => requestSupplierVariantPricingBusinessRequestHandler(deps)(event as IRequestSupplierVariantPricingBusinessRequestEvent),
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        requestValidator: updateSupplierVariantPriceValidator,
        responseValidator: businessRequestResponseValidator,
    },
)

export const createSupplierBusinessRequest = lambdaHandler(
    async (event) => createSupplierBusinessRequestHandler(deps)(event as ICreateSupplierBusinessRequestEvent),
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        requestValidator: createSupplierBusinessRequestValidator,
        responseValidator: businessRequestResponseValidator,
    },
)

export const getSupplierVariantRequestReferences = lambdaHandler(
    async (event) => getSupplierVariantRequestReferencesHandler(deps)(event as IGetSupplierVariantRequestReferencesEvent),
    {
        auth: { requiredPermissionGroups: ["supplier", "admin", "owner"] },
    },
)

export const decideBusinessRequest = lambdaHandler(
    async (event) => decideBusinessRequestHandler(deps)(event as IDecideBusinessRequestEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "sales", "sales_director", "purchasing", "admin", "owner"] },
        requestValidator: decideBusinessRequestValidator,
        responseValidator: businessRequestDecisionResponseValidator,
    },
)
