import { lambdaHandler } from "@/core/middy"
import { Resource } from "sst"
import { cognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { companyContactRepository } from "@/core/helpers/prisma/companyContacts/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { customerVariantSpecialPriceRepository } from "@/core/helpers/prisma/customerVariantSpecialPrices/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { userInvitationRepository } from "@/core/helpers/prisma/userInvitations/repository"
import {
    createManagedCustomerAddressHandler,
    createManagedCustomerSpecialPriceHandler,
    createManagedCustomerVisitHandler,
    createPortalCustomerUserHandler,
    convertManagedCustomerHandler,
    deactivateManagedCustomerSpecialPriceHandler,
    deleteManagedCustomerAddressHandler,
    deleteManagedCustomerVisitHandler,
    getManagedCustomerSpecialPriceHandler,
    getManagedCustomerHandler,
    getManagedSupplierHandler,
    getPortalCustomerAssignedProductsHandler,
    createPortalCustomerAddressHandler,
    deletePortalCustomerAddressHandler,
    getPortalCustomerFeaturedProductsHandler,
    getPortalCustomerHandler,
    listManagedCustomersMapHandler,
    listManagedCustomerSpecialPricesHandler,
    listManagedCompanyContactsHandler,
    listManagedCustomerAssignedProductsHandler,
    listManagedCustomerFeaturedProductsHandler,
    listManagedCustomersHandler,
    listManagedCustomerVisitsHandler,
    listManagedSuppliersHandler,
    listPortalCustomerSpecialPricesHandler,
    replaceManagedCustomerAssignedProductsHandler,
    replaceManagedCustomerFeaturedProductsHandler,
    updateManagedCustomerAddressHandler,
    updateManagedCustomerSpecialPriceHandler,
    updateManagedCustomerHandler,
    updatePortalCustomerAddressHandler,
    updateManagedCustomerVisitHandler,
} from "@/functions/ProtectedApi/functions/crm/handlers"
import type {
    ICreateManagedCustomerAddressEvent,
    ICreateManagedCustomerSpecialPriceEvent,
    ICreateManagedCustomerVisitEvent,
    ICreatePortalCustomerAddressEvent,
    ICreatePortalCustomerUserEvent,
    IDeleteManagedCustomerAddressEvent,
    IDeleteManagedCustomerVisitEvent,
    IDeletePortalCustomerAddressEvent,
    IListManagedCustomerSpecialPricesEvent,
    IListManagedCustomersEvent,
    IListManagedCustomersMapEvent,
    IListManagedSuppliersEvent,
    IManagedCustomerSpecialPriceEvent,
    IManagedCustomerEvent,
    IManagedSupplierEvent,
    IPortalCustomerSpecialPricesEvent,
    IReplaceManagedCustomerAssignedProductsEvent,
    IReplaceManagedCustomerFeaturedProductsEvent,
    IUpdateManagedCustomerAddressEvent,
    IUpdateManagedCustomerSpecialPriceEvent,
    IUpdateManagedCustomerEvent,
    IUpdatePortalCustomerAddressEvent,
    IUpdateManagedCustomerVisitEvent,
} from "@/functions/ProtectedApi/types/crm"
import {
    createCustomerVisitValidator,
    customerAssignedProductsResponseValidator,
    customerFeaturedProductsResponseValidator,
    customerIdValidator,
    customerResponseValidator,
    customerVisitIdValidator,
    customerVisitResponseValidator,
    customerVisitsResponseValidator,
    listCustomersResponseValidator,
    replaceCustomerAssignedProductsValidator,
    replaceCustomerFeaturedProductsValidator,
    updateCustomerValidator,
    updateCustomerVisitValidator,
} from "@/functions/AdminApi/validators/customers"
import { listCompanyContactsResponseValidator } from "@/functions/AdminApi/validators/companyContacts"
import {
    createManagedCustomerAddressValidator,
    createPortalCustomerAddressValidator,
    createPortalCustomerUserValidator,
    deleteManagedCustomerAddressValidator,
    deletePortalCustomerAddressValidator,
    customerMapPointsResponseValidator,
    listManagedCustomersMapValidator,
    updateManagedCustomerAddressValidator,
    updatePortalCustomerAddressValidator,
} from "@/functions/ProtectedApi/validators/crm"
import {
    createCustomerSpecialPriceValidator,
    customerSpecialPriceIdValidator,
    customerSpecialPriceListResponseValidator,
    customerSpecialPriceListValidator,
    customerSpecialPriceResponseValidator,
    portalSpecialPriceListValidator,
    updateCustomerSpecialPriceValidator,
} from "@/functions/ProtectedApi/validators/customerVariantSpecialPrices"
import {
    getSupplierValidator,
    listSuppliersResponseValidator,
    supplierResponseValidator,
} from "@/functions/AdminApi/validators/suppliers"
import { sendCustomerPortalInvitationEmail } from "@/functions/shared/mail/sendCustomerPortalInvitationEmail"

const deps = {
    customerRepository: customerRepository(),
    supplierRepository: supplierRepository(),
    productAttributeValueRepository: productAttributeValueRepository(),
    productRepository: productRepository(),
    productVariantRepository: productVariantRepository(),
    companyContactRepository: companyContactRepository(),
    customerVariantSpecialPriceRepository: customerVariantSpecialPriceRepository(),
    userRepository: userRepository(),
    userInvitationRepository: userInvitationRepository(),
    cognitoRepository: cognitoUserRepository(),
    userPoolId: Resource.CeyhunlarUserPool.id,
    frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? "",
    sendCustomerPortalInvitationEmail,
}

export const listManagedCustomers = lambdaHandler(
    async (event) => listManagedCustomersHandler(deps)(event as IListManagedCustomersEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        responseValidator: listCustomersResponseValidator,
    },
)

export const listManagedCustomersMap = lambdaHandler(
    async (event) => listManagedCustomersMapHandler(deps)(event as IListManagedCustomersMapEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: listManagedCustomersMapValidator,
        responseValidator: customerMapPointsResponseValidator,
    },
)

export const getManagedCustomer = lambdaHandler(
    async (event) => getManagedCustomerHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerIdValidator,
        responseValidator: customerResponseValidator,
    },
)

export const listManagedCompanyContacts = lambdaHandler(
    async () => listManagedCompanyContactsHandler(deps)(),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        responseValidator: listCompanyContactsResponseValidator,
    },
)

export const updateManagedCustomer = lambdaHandler(
    async (event) => updateManagedCustomerHandler(deps)(event as IUpdateManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: updateCustomerValidator,
        responseValidator: customerResponseValidator,
    },
)

export const convertManagedCustomer = lambdaHandler(
    async (event) => convertManagedCustomerHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerIdValidator,
        responseValidator: customerResponseValidator,
    },
)

export const listManagedCustomerFeaturedProducts = lambdaHandler(
    async (event) => listManagedCustomerFeaturedProductsHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerIdValidator,
        responseValidator: customerFeaturedProductsResponseValidator,
    },
)

export const replaceManagedCustomerFeaturedProducts = lambdaHandler(
    async (event) =>
        replaceManagedCustomerFeaturedProductsHandler(deps)(event as IReplaceManagedCustomerFeaturedProductsEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: replaceCustomerFeaturedProductsValidator,
        responseValidator: customerFeaturedProductsResponseValidator,
    },
)

export const listManagedCustomerAssignedProducts = lambdaHandler(
    async (event) => listManagedCustomerAssignedProductsHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerIdValidator,
        responseValidator: customerAssignedProductsResponseValidator,
    },
)

export const replaceManagedCustomerAssignedProducts = lambdaHandler(
    async (event) =>
        replaceManagedCustomerAssignedProductsHandler(deps)(event as IReplaceManagedCustomerAssignedProductsEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: replaceCustomerAssignedProductsValidator,
        responseValidator: customerAssignedProductsResponseValidator,
    },
)

export const listManagedCustomerSpecialPrices = lambdaHandler(
    async (event) =>
        listManagedCustomerSpecialPricesHandler(deps)(event as IListManagedCustomerSpecialPricesEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerSpecialPriceListValidator,
        responseValidator: customerSpecialPriceListResponseValidator,
    },
)

export const getManagedCustomerSpecialPrice = lambdaHandler(
    async (event) =>
        getManagedCustomerSpecialPriceHandler(deps)(event as IManagedCustomerSpecialPriceEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerSpecialPriceIdValidator,
        responseValidator: customerSpecialPriceResponseValidator,
    },
)

export const createManagedCustomerSpecialPrice = lambdaHandler(
    async (event) =>
        createManagedCustomerSpecialPriceHandler(deps)(event as ICreateManagedCustomerSpecialPriceEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: createCustomerSpecialPriceValidator,
        responseValidator: customerSpecialPriceResponseValidator,
    },
)

export const updateManagedCustomerSpecialPrice = lambdaHandler(
    async (event) =>
        updateManagedCustomerSpecialPriceHandler(deps)(event as IUpdateManagedCustomerSpecialPriceEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: updateCustomerSpecialPriceValidator,
        responseValidator: customerSpecialPriceResponseValidator,
    },
)

export const deactivateManagedCustomerSpecialPrice = lambdaHandler(
    async (event) =>
        deactivateManagedCustomerSpecialPriceHandler(deps)(event as IManagedCustomerSpecialPriceEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerSpecialPriceIdValidator,
        responseValidator: customerSpecialPriceResponseValidator,
    },
)

export const listManagedCustomerVisits = lambdaHandler(
    async (event) => listManagedCustomerVisitsHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerIdValidator,
        responseValidator: customerVisitsResponseValidator,
    },
)

export const createManagedCustomerVisit = lambdaHandler(
    async (event) => createManagedCustomerVisitHandler(deps)(event as ICreateManagedCustomerVisitEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: createCustomerVisitValidator,
        responseValidator: customerVisitResponseValidator,
    },
)

export const updateManagedCustomerVisit = lambdaHandler(
    async (event) => updateManagedCustomerVisitHandler(deps)(event as IUpdateManagedCustomerVisitEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: updateCustomerVisitValidator,
        responseValidator: customerVisitResponseValidator,
    },
)

export const deleteManagedCustomerVisit = lambdaHandler(
    async (event) => deleteManagedCustomerVisitHandler(deps)(event as IDeleteManagedCustomerVisitEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: customerVisitIdValidator,
        responseValidator: customerVisitResponseValidator,
    },
)

export const listManagedSuppliers = lambdaHandler(
    async (event) => listManagedSuppliersHandler(deps)(event as IListManagedSuppliersEvent),
    {
        auth: { requiredPermissionGroups: ["purchasing", "admin", "owner"] },
        responseValidator: listSuppliersResponseValidator,
    },
)

export const getManagedSupplier = lambdaHandler(
    async (event) => getManagedSupplierHandler(deps)(event as IManagedSupplierEvent),
    {
        auth: { requiredPermissionGroups: ["purchasing", "admin", "owner"] },
        requestValidator: getSupplierValidator,
        responseValidator: supplierResponseValidator,
    },
)

export const getPortalCustomer = lambdaHandler(
    async (event) => getPortalCustomerHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        responseValidator: customerResponseValidator,
    },
)

export const listPortalCustomerSpecialPrices = lambdaHandler(
    async (event) =>
        listPortalCustomerSpecialPricesHandler(deps)(event as IPortalCustomerSpecialPricesEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: portalSpecialPriceListValidator,
        responseValidator: customerSpecialPriceListResponseValidator,
    },
)

export const getPortalCustomerFeaturedProducts = lambdaHandler(
    async (event) => getPortalCustomerFeaturedProductsHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        responseValidator: customerFeaturedProductsResponseValidator,
    },
)

export const createPortalCustomerAddress = lambdaHandler(
    async (event) => createPortalCustomerAddressHandler(deps)(event as ICreatePortalCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: createPortalCustomerAddressValidator,
        responseValidator: customerResponseValidator,
    },
)

export const createPortalCustomerUser = lambdaHandler(
    async (event) => createPortalCustomerUserHandler(deps)(event as ICreatePortalCustomerUserEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: createPortalCustomerUserValidator,
        responseValidator: customerResponseValidator,
    },
)

export const updatePortalCustomerAddress = lambdaHandler(
    async (event) => updatePortalCustomerAddressHandler(deps)(event as IUpdatePortalCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: updatePortalCustomerAddressValidator,
        responseValidator: customerResponseValidator,
    },
)

export const deletePortalCustomerAddress = lambdaHandler(
    async (event) => deletePortalCustomerAddressHandler(deps)(event as IDeletePortalCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: deletePortalCustomerAddressValidator,
        responseValidator: customerResponseValidator,
    },
)

export const createManagedCustomerAddress = lambdaHandler(
    async (event) => createManagedCustomerAddressHandler(deps)(event as ICreateManagedCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: createManagedCustomerAddressValidator,
        responseValidator: customerResponseValidator,
    },
)

export const updateManagedCustomerAddress = lambdaHandler(
    async (event) => updateManagedCustomerAddressHandler(deps)(event as IUpdateManagedCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: updateManagedCustomerAddressValidator,
        responseValidator: customerResponseValidator,
    },
)

export const deleteManagedCustomerAddress = lambdaHandler(
    async (event) => deleteManagedCustomerAddressHandler(deps)(event as IDeleteManagedCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: deleteManagedCustomerAddressValidator,
        responseValidator: customerResponseValidator,
    },
)

export const getPortalCustomerAssignedProducts = lambdaHandler(
    async (event) => getPortalCustomerAssignedProductsHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        responseValidator: customerAssignedProductsResponseValidator,
    },
)
