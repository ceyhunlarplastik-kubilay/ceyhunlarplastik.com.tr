import { lambdaHandler } from "@/core/middy"
import { productionVariantProfileRepository } from "@/core/helpers/prisma/productionVariantProfiles/repository"
import {
    listProductionVariantsHandler,
    upsertProductionVariantProfileHandler,
} from "@/functions/ProtectedApi/functions/productionVariantProfiles/handlers"
import {
    listProductionVariantsResponseValidator,
    listProductionVariantsValidator,
    productionVariantResponseValidator,
    upsertProductionVariantProfileValidator,
} from "@/functions/ProtectedApi/validators/productionVariantProfiles"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    IListProductionVariantsEvent,
    IUpsertProductionVariantProfileEvent,
} from "@/functions/ProtectedApi/types/productionVariantProfiles"

const deps = () => ({
    productionVariantProfileRepository: productionVariantProfileRepository(),
})

export const listProductionVariants = lambdaHandler(
    async (event) => listProductionVariantsHandler(deps())(event as IListProductionVariantsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: listProductionVariantsValidator,
        responseValidator: listProductionVariantsResponseValidator,
    },
)

export const upsertProductionVariantProfile = lambdaHandler(
    withProductionChange("definitions", async (event) => upsertProductionVariantProfileHandler(deps())(event as IUpsertProductionVariantProfileEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: upsertProductionVariantProfileValidator,
        responseValidator: productionVariantResponseValidator,
    },
)
