import { lambdaHandler } from "@/core/middy"
import { materialRepository } from "@/core/helpers/prisma/materials/repository"
import { assetRepository } from "@/core/helpers/prisma/assets/repository"

import {
    createMaterialAssetUploadHandler,
    createMaterialHandler,
    deleteMaterialHandler,
    getMaterialHandler,
    listMaterialsHandler,
    updateMaterialHandler,
} from "@/functions/AdminApi/functions/materials/handlers"

import {
    ICreateMaterialEvent,
    ICreateMaterialAssetUploadEvent,
    IDeleteMaterialEvent,
    IGetMaterialEvent,
    IListMaterialsEvent,
    IUpdateMaterialEvent,
} from "@/functions/AdminApi/types/materials"

import {
    createMaterialAssetUploadValidator,
    createMaterialValidator,
    idValidator,
    updateMaterialValidator,
    materialResponseValidator,
    listMaterialResponseValidator,
} from "@/functions/AdminApi/validators/materials"

export const listMaterials = lambdaHandler(
    async (event) =>
        listMaterialsHandler({
            materialRepository: materialRepository(),
        })(event as IListMaterialsEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listMaterialResponseValidator,
    }
)

export const getMaterial = lambdaHandler(
    async (event) =>
        getMaterialHandler({
            materialRepository: materialRepository(),
        })(event as IGetMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: materialResponseValidator,
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
        responseValidator: materialResponseValidator,
    }
)

export const updateMaterial = lambdaHandler(
    async (event) =>
        updateMaterialHandler({
            materialRepository: materialRepository(),
            assetRepository: assetRepository(),
        })(event as IUpdateMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateMaterialValidator,
        responseValidator: materialResponseValidator,
    }
)

export const deleteMaterial = lambdaHandler(
    async (event) =>
        deleteMaterialHandler({
            materialRepository: materialRepository(),
        })(event as IDeleteMaterialEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: materialResponseValidator,
    }
)

export const createMaterialAssetUpload = lambdaHandler(
    async (event) =>
        createMaterialAssetUploadHandler({
            materialRepository: materialRepository(),
        })(event as ICreateMaterialAssetUploadEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createMaterialAssetUploadValidator,
    }
)
