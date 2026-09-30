import { lambdaHandler } from "@/core/middy"
import { productionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import {
    getReferenceProductSizesHandler,
    getReferenceProductVariantsHandler,
    listReferenceProductsHandler,
    searchReferenceCustomersHandler,
} from "@/functions/ProtectedApi/functions/productionReferences/handlers"
import {
    getReferenceProductSizesValidator,
    listReferenceProductsResponseValidator,
    listReferenceProductsValidator,
    referenceProductSizesResponseValidator,
    referenceProductVariantsResponseValidator,
    searchReferenceCustomersResponseValidator,
    searchReferenceCustomersValidator,
} from "@/functions/ProtectedApi/validators/productionReferences"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import type {
    IGetReferenceProductSizesEvent,
    IGetReferenceProductVariantsEvent,
    IListReferenceProductsEvent,
    ISearchReferenceCustomersEvent,
} from "@/functions/ProtectedApi/types/productionReferences"

const deps = () => ({
    productionReferenceRepository: productionReferenceRepository(),
})

export const listReferenceProducts = lambdaHandler(
    async (event) => listReferenceProductsHandler(deps())(event as IListReferenceProductsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: listReferenceProductsValidator,
        responseValidator: listReferenceProductsResponseValidator,
    },
)

export const getReferenceProductSizes = lambdaHandler(
    async (event) => getReferenceProductSizesHandler(deps())(event as IGetReferenceProductSizesEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getReferenceProductSizesValidator,
        responseValidator: referenceProductSizesResponseValidator,
    },
)

/** Üretim emri: üretilebilir ölçüler ve o ölçülerin varyantları (renk + hammadde). */
export const getReferenceProductVariants = lambdaHandler(
    async (event) => getReferenceProductVariantsHandler(deps())(event as IGetReferenceProductVariantsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getReferenceProductSizesValidator,
        responseValidator: referenceProductVariantsResponseValidator,
    },
)

/** Emir için müşteri araması — yalnız id + ad (ticari alan yok). */
export const searchReferenceCustomers = lambdaHandler(
    async (event) => searchReferenceCustomersHandler(deps())(event as ISearchReferenceCustomersEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: searchReferenceCustomersValidator,
        responseValidator: searchReferenceCustomersResponseValidator,
    },
)
