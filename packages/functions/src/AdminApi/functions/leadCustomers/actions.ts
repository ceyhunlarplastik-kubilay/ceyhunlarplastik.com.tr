import { lambdaHandler } from "@/core/middy"
import { customerRepository } from "@/core/helpers/prisma/customers/repository"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import {
    createLeadCustomerAddressHandler,
    createLeadCustomerHandler,
    bulkDeleteLeadCustomersHandler,
    deleteLeadCustomerAddressHandler,
    deleteLeadCustomerHandler,
    getLeadCustomerHandler,
    listLeadCustomersHandler,
    updateLeadCustomerAddressHandler,
    updateLeadCustomerHandler,
} from "@/functions/AdminApi/functions/leadCustomers/handlers"
import {
    createLeadCustomerAddressValidator,
    createLeadCustomerValidator,
    bulkDeleteLeadCustomersValidator,
    deleteLeadCustomerAddressValidator,
    deleteLeadCustomerValidator,
    deleteLeadCustomersResponseValidator,
    getLeadCustomerValidator,
    leadCustomerDetailResponseValidator,
    listLeadCustomersResponseValidator,
    listLeadCustomersValidator,
    updateLeadCustomerAddressValidator,
    updateLeadCustomerValidator,
} from "@/functions/AdminApi/validators/leadCustomers"
import type {
    ICreateLeadCustomerAddressEvent,
    ICreateLeadCustomerEvent,
    IBulkDeleteLeadCustomersEvent,
    IDeleteLeadCustomerAddressEvent,
    IDeleteLeadCustomerEvent,
    IGetLeadCustomerEvent,
    IListLeadCustomersEvent,
    IUpdateLeadCustomerAddressEvent,
    IUpdateLeadCustomerEvent,
} from "@/functions/AdminApi/types/leadCustomers"

/**
 * `admin` + `content_editor`. `/customers` uçlarından bilinçli olarak AYRI:
 * o uçlar ticari alanları ve LEAD↔CUSTOMER dönüşümünü kabul ediyor ve
 * `admin`+`owner` ile sınırlı. Buradaki şema ticari alanı hiç tanımaz.
 */
const leadCustomerManagerGroups = ["admin", "content_editor"]
// Toplu silme geri alınamaz ve tek tıkla çok kayıt gider — yalnız yönetici.
const leadCustomerBulkDeleteGroups = ["admin"]

const deps = () => ({
    productAttributeValueRepository: productAttributeValueRepository(),
    // Oluşturma dialogunda adres de gönderilebiliyor.
    customerRepository: customerRepository(),
})

const addressDeps = () => ({
    customerRepository: customerRepository(),
})

export const listLeadCustomers = lambdaHandler(
    async (event) => listLeadCustomersHandler()(event as IListLeadCustomersEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: listLeadCustomersValidator,
        responseValidator: listLeadCustomersResponseValidator,
    },
)

export const getLeadCustomer = lambdaHandler(
    async (event) => getLeadCustomerHandler()(event as IGetLeadCustomerEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: getLeadCustomerValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)

export const createLeadCustomer = lambdaHandler(
    async (event) => createLeadCustomerHandler(deps())(event as ICreateLeadCustomerEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: createLeadCustomerValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)

export const updateLeadCustomer = lambdaHandler(
    async (event) => updateLeadCustomerHandler(deps())(event as IUpdateLeadCustomerEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: updateLeadCustomerValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)

export const createLeadCustomerAddress = lambdaHandler(
    async (event) =>
        createLeadCustomerAddressHandler(addressDeps())(event as ICreateLeadCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: createLeadCustomerAddressValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)

export const updateLeadCustomerAddress = lambdaHandler(
    async (event) =>
        updateLeadCustomerAddressHandler(addressDeps())(event as IUpdateLeadCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: updateLeadCustomerAddressValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)

export const deleteLeadCustomerAddress = lambdaHandler(
    async (event) =>
        deleteLeadCustomerAddressHandler(addressDeps())(event as IDeleteLeadCustomerAddressEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: deleteLeadCustomerAddressValidator,
        responseValidator: leadCustomerDetailResponseValidator,
    },
)

export const deleteLeadCustomer = lambdaHandler(
    async (event) => deleteLeadCustomerHandler()(event as IDeleteLeadCustomerEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerManagerGroups },
        requestValidator: deleteLeadCustomerValidator,
        responseValidator: deleteLeadCustomersResponseValidator,
    },
)

export const bulkDeleteLeadCustomers = lambdaHandler(
    async (event) => bulkDeleteLeadCustomersHandler()(event as IBulkDeleteLeadCustomersEvent),
    {
        auth: { requiredPermissionGroups: leadCustomerBulkDeleteGroups },
        requestValidator: bulkDeleteLeadCustomersValidator,
        responseValidator: deleteLeadCustomersResponseValidator,
    },
)
