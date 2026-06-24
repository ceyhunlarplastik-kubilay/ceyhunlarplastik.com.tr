import { lambdaHandler } from "@/core/middy"
import { materialRepository } from "@/core/helpers/prisma/materials/repository"
import { getMaterialHandler, listMaterialsHandler } from "@/functions/PublicApi/functions/materials/handlers"
import {
    getMaterialResponseValidator,
    idValidator,
    listMaterialsResponseValidator,
} from "@/functions/PublicApi/validators/materials"
import type {
    IGetMaterialEvent,
    IListMaterialsEvent,
} from "@/functions/PublicApi/types/materials"

const getDeps = () => ({
    materialRepository: materialRepository(),
})

export const listMaterials = lambdaHandler(
    async (event) => listMaterialsHandler(getDeps())(event as IListMaterialsEvent),
    {
        auth: false,
        responseValidator: listMaterialsResponseValidator,
    },
)

export const getMaterial = lambdaHandler(
    async (event) => getMaterialHandler(getDeps())(event as IGetMaterialEvent),
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: getMaterialResponseValidator,
    },
)
