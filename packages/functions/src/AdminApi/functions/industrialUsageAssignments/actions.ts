import { lambdaHandler } from "@/core/middy"
import {
    listIndustrialUsageAssignmentProductsHandler,
    patchIndustrialUsageAssignmentProductsHandler,
} from "@/functions/AdminApi/functions/industrialUsageAssignments/handlers"
import {
    listIndustrialUsageAssignmentProductsResponseValidator,
    listIndustrialUsageAssignmentProductsValidator,
    patchIndustrialUsageAssignmentProductsResponseValidator,
    patchIndustrialUsageAssignmentProductsValidator,
} from "@/functions/AdminApi/validators/industrialUsageAssignments"
import type {
    IListIndustrialUsageAssignmentProductsEvent,
    IPatchIndustrialUsageAssignmentProductsEvent,
} from "@/functions/AdminApi/types/industrialUsageAssignments"

const industrialUsageAssignmentManagerGroups = ["admin", "content_editor"]

export const listIndustrialUsageAssignmentProducts = lambdaHandler(
    async (event) =>
        listIndustrialUsageAssignmentProductsHandler()(
            event as IListIndustrialUsageAssignmentProductsEvent,
        ),
    {
        auth: { requiredPermissionGroups: industrialUsageAssignmentManagerGroups },
        requestValidator: listIndustrialUsageAssignmentProductsValidator,
        responseValidator: listIndustrialUsageAssignmentProductsResponseValidator,
    },
)

export const patchIndustrialUsageAssignmentProducts = lambdaHandler(
    async (event) =>
        patchIndustrialUsageAssignmentProductsHandler()(
            event as IPatchIndustrialUsageAssignmentProductsEvent,
        ),
    {
        auth: { requiredPermissionGroups: industrialUsageAssignmentManagerGroups },
        requestValidator: patchIndustrialUsageAssignmentProductsValidator,
        responseValidator: patchIndustrialUsageAssignmentProductsResponseValidator,
    },
)
