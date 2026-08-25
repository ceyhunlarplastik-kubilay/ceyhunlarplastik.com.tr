import { lambdaHandler } from "@/core/middy"
import { variantVersionRepository } from "@/core/helpers/prisma/variantVersions/repository"

import {
    listVariantVersionsHandler,
    createVariantVersionHandler,
    updateVariantVersionHandler,
    deleteVariantVersionHandler,
} from "@/functions/AdminApi/functions/variantVersions/handlers"
import {
    listVariantVersionsValidator,
    createVariantVersionValidator,
    updateVariantVersionValidator,
    variantVersionIdValidator,
    listVariantVersionsResponseValidator,
    variantVersionResponseValidator,
    deleteVariantVersionResponseValidator,
} from "@/functions/AdminApi/validators/variantVersions"
import type {
    IVariantVersionDependencies,
    IListVariantVersionsEvent,
    ICreateVariantVersionEvent,
    IUpdateVariantVersionEvent,
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

// Düzenleme HİÇBİR varyant kodunu değiştirmez (kod = numara, renk/hammadde
// kodda geçmez), bu yüzden hatayı yapan operatör de düzeltebilmeli.
export const updateVariantVersion = lambdaHandler(
    async (event) => updateVariantVersionHandler(getDeps())(event as IUpdateVariantVersionEvent),
    {
        auth: { requiredPermissionGroups: variantVersionManagerGroups },
        requestValidator: updateVariantVersionValidator,
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
