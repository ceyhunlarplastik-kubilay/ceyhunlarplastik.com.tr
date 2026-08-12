import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { ApplyIndustrialUsageFunctionRow } from "@/core/helpers/products/industrialUsageFunctionPlan"

export type IGetProductIndustrialUsageFunctionsEvent =
    IAPIGatewayProxyEventWithUserGeneric<{}, { id: string }>

export type IApplyProductIndustrialUsageFunctionsBody = {
    rows: ApplyIndustrialUsageFunctionRow[]
}

export type IApplyProductIndustrialUsageFunctionsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        IApplyProductIndustrialUsageFunctionsBody,
        { id: string }
    >
