import { lambdaHandler } from "@/core/middy"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { companyContactRepository } from "@/core/helpers/prisma/companyContacts/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { customerVariantSpecialPriceRepository } from "@/core/helpers/prisma/customerVariantSpecialPrices/repository"
import {
    createManagedCustomerSpecialPriceHandler,
    createManagedCustomerVisitHandler,
    convertManagedCustomerHandler,
    deactivateManagedCustomerSpecialPriceHandler,
    deleteManagedCustomerVisitHandler,
    getManagedCustomerSpecialPriceHandler,
    getManagedCustomerHandler,
    getManagedSupplierHandler,
    getPortalCustomerAssignedProductsHandler,
    createPortalCustomerAddressHandler,
    getPortalCustomerFeaturedProductsHandler,
    getPortalCustomerHandler,
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
    updateManagedCustomerSpecialPriceHandler,
    updateManagedCustomerHandler,
    updateManagedCustomerVisitHandler,
} from "@/functions/ProtectedApi/functions/crm/handlers"
import type {
    ICreateManagedCustomerSpecialPriceEvent,
    ICreateManagedCustomerVisitEvent,
    ICreatePortalCustomerAddressEvent,
    IDeleteManagedCustomerVisitEvent,
    IListManagedCustomerSpecialPricesEvent,
    IListManagedCustomersEvent,
    IListManagedSuppliersEvent,
    IManagedCustomerSpecialPriceEvent,
    IManagedCustomerEvent,
    IManagedSupplierEvent,
    IPortalCustomerSpecialPricesEvent,
    IReplaceManagedCustomerAssignedProductsEvent,
    IReplaceManagedCustomerFeaturedProductsEvent,
    IUpdateManagedCustomerSpecialPriceEvent,
    IUpdateManagedCustomerEvent,
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
import { createPortalCustomerAddressValidator } from "@/functions/ProtectedApi/validators/crm"
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

const deps = {
    customerRepository: customerRepository(),
    supplierRepository: supplierRepository(),
    productAttributeValueRepository: productAttributeValueRepository(),
    productRepository: productRepository(),
    productVariantRepository: productVariantRepository(),
    companyContactRepository: companyContactRepository(),
    customerVariantSpecialPriceRepository: customerVariantSpecialPriceRepository(),
}

export const listManagedCustomers = lambdaHandler(
    async (event) => listManagedCustomersHandler(deps)(event as IListManagedCustomersEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        responseValidator: listCustomersResponseValidator,
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

export const getPortalCustomerAssignedProducts = lambdaHandler(
    async (event) => getPortalCustomerAssignedProductsHandler(deps)(event as IManagedCustomerEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        responseValidator: customerAssignedProductsResponseValidator,
    },
)
