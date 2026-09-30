import { lambdaHandler } from "@/core/middy"
import { productionMaterialProfileRepository } from "@/core/helpers/prisma/productionMaterialProfiles/repository"
import {
    listMaterialProfilesHandler,
    upsertMaterialProfileHandler,
} from "@/functions/ProtectedApi/functions/productionMaterialProfiles/handlers"
import {
    listMaterialProfilesResponseValidator,
    materialProfileResponseValidator,
    upsertMaterialProfileValidator,
} from "@/functions/ProtectedApi/validators/productionMaterialProfiles"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    IListMaterialProfilesEvent,
    IUpsertMaterialProfileEvent,
} from "@/functions/ProtectedApi/types/productionMaterialProfiles"


const deps = () => ({
    productionMaterialProfileRepository: productionMaterialProfileRepository(),
})

export const listMaterialProfiles = lambdaHandler(
    async (event) => listMaterialProfilesHandler(deps())(event as IListMaterialProfilesEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: listMaterialProfilesResponseValidator,
    },
)

export const upsertMaterialProfile = lambdaHandler(
    withProductionChange("definitions", async (event) => upsertMaterialProfileHandler(deps())(event as IUpsertMaterialProfileEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: upsertMaterialProfileValidator,
        responseValidator: materialProfileResponseValidator,
    },
)
