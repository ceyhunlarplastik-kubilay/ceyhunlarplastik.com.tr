import { lambdaHandler } from "@/core/middy"
import { companyContactRepository } from "@/core/helpers/prisma/companyContacts/repository"
import {
    createCompanyContactHandler,
    getCompanyContactHandler,
    listCompanyContactsHandler,
    updateCompanyContactHandler,
} from "@/functions/AdminApi/functions/companyContacts/handlers"
import type {
    ICreateCompanyContactEvent,
    IGetCompanyContactEvent,
    IListCompanyContactsEvent,
    IUpdateCompanyContactEvent,
} from "@/functions/AdminApi/types/companyContacts"
import {
    companyContactIdValidator,
    companyContactResponseValidator,
    createCompanyContactValidator,
    listCompanyContactsResponseValidator,
    updateCompanyContactValidator,
} from "@/functions/AdminApi/validators/companyContacts"

const deps = {
    companyContactRepository: companyContactRepository(),
}

export const listCompanyContacts = lambdaHandler(
    async (event) => listCompanyContactsHandler(deps)(event as IListCompanyContactsEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        responseValidator: listCompanyContactsResponseValidator,
    },
)

export const getCompanyContact = lambdaHandler(
    async (event) => getCompanyContactHandler(deps)(event as IGetCompanyContactEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: companyContactIdValidator,
        responseValidator: companyContactResponseValidator,
    },
)

export const createCompanyContact = lambdaHandler(
    async (event) => createCompanyContactHandler(deps)(event as ICreateCompanyContactEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: createCompanyContactValidator,
        responseValidator: companyContactResponseValidator,
    },
)

export const updateCompanyContact = lambdaHandler(
    async (event) => updateCompanyContactHandler(deps)(event as IUpdateCompanyContactEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: updateCompanyContactValidator,
        responseValidator: companyContactResponseValidator,
    },
)
