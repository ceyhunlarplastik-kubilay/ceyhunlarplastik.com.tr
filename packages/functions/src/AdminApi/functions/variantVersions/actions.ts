import { lambdaHandler } from "@/core/middy"
import { variantVersionRepository } from "@/core/helpers/prisma/variantVersions/repository"

import {
    listVariantVersionsHandler,
    createVariantVersionHandler,
    deleteVariantVersionHandler,
} from "@/functions/AdminApi/functions/variantVersions/handlers"
import {
    listVariantVersionsValidator,
    createVariantVersionValidator,
    variantVersionIdValidator,
    listVariantVersionsResponseValidator,
    variantVersionResponseValidator,
    deleteVariantVersionResponseValidator,
} from "@/functions/AdminApi/validators/variantVersions"
import type {
    IVariantVersionDependencies,
    IListVariantVersionsEvent,
    ICreateVariantVersionEvent,
    IDeleteVariantVersionEvent,
} from "@/functions/AdminApi/types/variantVersions"

// Sözlük katalog verisidir (renk + hammadde); veri girişi operatörü de yönetir.
const variantVersionManagerGroups = ["admin", "content_editor"]
// Silme sözlükte kalıcı boşluk bırakır — yalnız yönetici.
const variantVersionAdminGroups = ["admin"]

const getDeps = (): IVariantVersionDependencies => ({
    variantVersionRepository: variantVersionRepository(),
})

export const listVariantVersions = lambdaHandler(
    async (event) => listVariantVersionsHandler(getDeps())(event as IListVariantVersionsEvent),
    {
        auth: { requiredPermissionGroups: variantVersionManagerGroups },
        requestValidator: listVariantVersionsValidator,
        responseValidator: listVariantVersionsResponseValidator,
    }
)

export const createVariantVersion = lambdaHandler(
    async (event) => createVariantVersionHandler(getDeps())(event as ICreateVariantVersionEvent),
    {
        auth: { requiredPermissionGroups: variantVersionManagerGroups },
        requestValidator: createVariantVersionValidator,
        responseValidator: variantVersionResponseValidator,
    }
)

export const deleteVariantVersion = lambdaHandler(
    async (event) => deleteVariantVersionHandler(getDeps())(event as IDeleteVariantVersionEvent),
    {
        auth: { requiredPermissionGroups: variantVersionAdminGroups },
        requestValidator: variantVersionIdValidator,
        responseValidator: deleteVariantVersionResponseValidator,
    }
)
