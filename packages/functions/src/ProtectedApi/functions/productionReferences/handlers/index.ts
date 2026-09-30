import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IGetReferenceProductSizesEvent,
    IGetReferenceProductVariantsEvent,
    IListReferenceProductsEvent,
    IProductionReferenceDependencies,
    ISearchReferenceCustomersEvent,
} from "@/functions/ProtectedApi/types/productionReferences"

export const listReferenceProductsHandler = ({ productionReferenceRepository }: IProductionReferenceDependencies) => {
    return async (event: IListReferenceProductsEvent) => {
        const moldableOnly = event.queryStringParameters?.moldable === "true"
        const products = await productionReferenceRepository.listProductsWithSizes({ moldableOnly })
        return apiResponseDTO({ statusCode: 200, payload: { products } })
    }
}

export const getReferenceProductSizesHandler = ({ productionReferenceRepository }: IProductionReferenceDependencies) => {
    return async (event: IGetReferenceProductSizesEvent) => {
        const result = await productionReferenceRepository.getProductSizes(event.pathParameters.id)
        if (!result) throw new createError.NotFound("Ürün modeli bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: result })
    }
}

export const getReferenceProductVariantsHandler = ({ productionReferenceRepository }: IProductionReferenceDependencies) => {
    return async (event: IGetReferenceProductVariantsEvent) => {
        const result = await productionReferenceRepository.getProductVariants(event.pathParameters.id)
        if (!result) throw new createError.NotFound("Ürün modeli bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: result })
    }
}

export const searchReferenceCustomersHandler = ({ productionReferenceRepository }: IProductionReferenceDependencies) => {
    return async (event: ISearchReferenceCustomersEvent) => {
        const customers = await productionReferenceRepository.searchCustomers(event.queryStringParameters?.q ?? "")
        return apiResponseDTO({ statusCode: 200, payload: { customers } })
    }
}
