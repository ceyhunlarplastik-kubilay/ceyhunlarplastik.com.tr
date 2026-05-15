import { lambdaHandler } from "@/core/middy";
import { businessRequestRepository } from "@/core/helpers/prisma/businessRequests/repository";
import { customerRepository } from "@/core/helpers/prisma/customers/repository";
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";
import { createPortalBusinessRequestHandler, decideBusinessRequestHandler, listPortalBusinessRequestsHandler, listPurchasingBusinessRequestsHandler, listSalesBusinessRequestsHandler, listSupplierBusinessRequestsHandler, requestSupplierProfileBusinessRequestHandler, requestSupplierVariantPricingBusinessRequestHandler, } from "@/functions/ProtectedApi/functions/businessRequests/handlers";
import { businessRequestDecisionResponseValidator, businessRequestListResponseValidator, businessRequestResponseValidator, createPortalBusinessRequestValidator, decideBusinessRequestValidator, listBusinessRequestsValidator, } from "@/functions/AdminApi/validators/businessRequests";
import { updateSupplierProfileValidator, updateSupplierVariantPriceValidator, } from "@/functions/ProtectedApi/validators/supplierVariantPrices";
const deps = {
    businessRequestRepository: businessRequestRepository(),
    customerRepository: customerRepository(),
    supplierRepository: supplierRepository(),
    productVariantSupplierRepository: productVariantSupplierRepository(),
    workflowArn: process.env.BUSINESS_APPROVAL_WORKFLOW_ARN ?? "",
};
export const listPortalBusinessRequests = lambdaHandler(async (event) => listPortalBusinessRequestsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
    requestValidator: listBusinessRequestsValidator,
    responseValidator: businessRequestListResponseValidator,
});
export const createPortalBusinessRequest = lambdaHandler(async (event) => createPortalBusinessRequestHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
    requestValidator: createPortalBusinessRequestValidator,
    responseValidator: businessRequestResponseValidator,
});
export const listSalesBusinessRequests = lambdaHandler(async (event) => listSalesBusinessRequestsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
    requestValidator: listBusinessRequestsValidator,
    responseValidator: businessRequestListResponseValidator,
});
export const listPurchasingBusinessRequests = lambdaHandler(async (event) => listPurchasingBusinessRequestsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["purchasing", "admin", "owner"] },
    requestValidator: listBusinessRequestsValidator,
    responseValidator: businessRequestListResponseValidator,
});
export const listSupplierBusinessRequests = lambdaHandler(async (event) => listSupplierBusinessRequestsHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["supplier", "admin", "owner"] },
    requestValidator: listBusinessRequestsValidator,
    responseValidator: businessRequestListResponseValidator,
});
export const requestSupplierProfileBusinessRequest = lambdaHandler(async (event) => requestSupplierProfileBusinessRequestHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["supplier"] },
    requestValidator: updateSupplierProfileValidator,
    responseValidator: businessRequestResponseValidator,
});
export const requestSupplierVariantPricingBusinessRequest = lambdaHandler(async (event) => requestSupplierVariantPricingBusinessRequestHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["supplier"] },
    requestValidator: updateSupplierVariantPriceValidator,
    responseValidator: businessRequestResponseValidator,
});
export const decideBusinessRequest = lambdaHandler(async (event) => decideBusinessRequestHandler(deps)(event), {
    auth: { requiredPermissionGroups: ["customer", "sales", "sales_director", "purchasing", "admin", "owner"] },
    requestValidator: decideBusinessRequestValidator,
    responseValidator: businessRequestDecisionResponseValidator,
});
