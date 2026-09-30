import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"

export interface IProductionReferenceDependencies {
    productionReferenceRepository: IPrismaProductionReferenceRepository
}

export type IListReferenceProductsEvent = IAPIGatewayProxyEventWithUserGeneric<
    unknown,
    unknown,
    { moldable?: "true" | "false" } | undefined
>

export type IGetReferenceProductSizesEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

export type IGetReferenceProductVariantsEvent = IGetReferenceProductSizesEvent

export type ISearchReferenceCustomersEvent = IAPIGatewayProxyEventWithUserGeneric<
    unknown,
    unknown,
    { q?: string } | undefined
>
