import { lambdaHandler } from "@/core/middy"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { supplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import {
    listSupplierApprovalRequestsHandler,
    requestSupplierProfileApprovalHandler,
    requestSupplierVariantPricingApprovalHandler,
} from "@/functions/ProtectedApi/functions/supplierApprovalRequests/handlers"
import type {
    IListSupplierApprovalRequestsEvent,
    IRequestSupplierProfileApprovalEvent,
    IRequestSupplierVariantPricingApprovalEvent,
    ISupplierApprovalRequestDependencies,
} from "@/functions/ProtectedApi/types/supplierApprovalRequests"
import {
    listSupplierApprovalRequestsResponseValidator,
    supplierApprovalRequestResponseValidator,
} from "@/functions/ProtectedApi/validators/supplierApprovalRequests"
import {
    updateSupplierProfileValidator,
    updateSupplierVariantPriceValidator,
} from "@/functions/ProtectedApi/validators/supplierVariantPrices"

const getDeps = (): ISupplierApprovalRequestDependencies => ({
    productVariantSupplierRepository: productVariantSupplierRepository(),
    supplierApprovalRequestRepository: supplierApprovalRequestRepository(),
    supplierRepository: supplierRepository(),
    workflowArn: process.env.SUPPLIER_APPROVAL_WORKFLOW_ARN ?? "",
})

export const listSupplierApprovalRequests = lambdaHandler(
    async (event) =>
        listSupplierApprovalRequestsHandler(getDeps())(
            event as IListSupplierApprovalRequestsEvent
        ),
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        responseValidator: listSupplierApprovalRequestsResponseValidator,
    }
)

export const requestSupplierProfileApproval = lambdaHandler(
    async (event) =>
        requestSupplierProfileApprovalHandler(getDeps())(
            event as IRequestSupplierProfileApprovalEvent
        ),
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        requestValidator: updateSupplierProfileValidator,
        responseValidator: supplierApprovalRequestResponseValidator,
    }
)

export const requestSupplierVariantPricingApproval = lambdaHandler(
    async (event) =>
        requestSupplierVariantPricingApprovalHandler(getDeps())(
            event as IRequestSupplierVariantPricingApprovalEvent
        ),
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        requestValidator: updateSupplierVariantPriceValidator,
        responseValidator: supplierApprovalRequestResponseValidator,
    }
)
