import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IndustrialUsageAssignmentFilter } from "@/core/helpers/products/industrialUsageAssignments"

export type IListIndustrialUsageAssignmentProductsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        { usageAreaValueId: string },
        {
            page?: string
            limit?: string
            search?: string
            assignment?: IndustrialUsageAssignmentFilter
        }
    >

export type IPatchIndustrialUsageAssignmentProductsBody = {
    addProductIds?: string[]
    removeProductIds?: string[]
}

export type IPatchIndustrialUsageAssignmentProductsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IPatchIndustrialUsageAssignmentProductsBody,
        { usageAreaValueId: string }
    >
