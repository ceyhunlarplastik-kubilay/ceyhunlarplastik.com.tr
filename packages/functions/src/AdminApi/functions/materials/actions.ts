import { lambdaHandler } from "@/core/middy"
import { materialRepository } from "@/core/helpers/prisma/materials/repository"

import {
    createMaterialHandler,
    deleteMaterialHandler,
    getMaterialHandler,
    listMaterialsHandler,
    updateMaterialHandler,
} from "@/functions/AdminApi/functions/materials/handlers"

import {
    ICreateMaterialEvent,
    IDeleteMaterialEvent,
    IGetMaterialEvent,
    IListMaterialsEvent,
    IUpdateMaterialEvent,
} from "@/functions/AdminApi/types/materials"

import {
    createMaterialValidator,
    idValidator,
    updateMaterialValidator,
} from "@/functions/AdminApi/validators/materials"

export const listMaterials = lambdaHandler(
    async (event) =>
        listMaterialsHandler({
            materialRepository: materialRepository(),
        } as any)(event as IListMaterialsEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
    }
)

export const getMaterial = lambdaHandler(
    async (event) =>
        getMaterialHandler({
            materialRepository: materialRepository(),
        } as any)(event as IGetMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)

export const createMaterial = lambdaHandler(
    async (event) =>
        createMaterialHandler({
            materialRepository: materialRepository(),
        })(event as ICreateMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createMaterialValidator,
    }
)

export const updateMaterial = lambdaHandler(
    async (event) =>
        updateMaterialHandler({
            materialRepository: materialRepository(),
        })(event as IUpdateMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateMaterialValidator,
    }
)

export const deleteMaterial = lambdaHandler(
    async (event) =>
        deleteMaterialHandler({
            materialRepository: materialRepository(),
        } as any)(event as IDeleteMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)
