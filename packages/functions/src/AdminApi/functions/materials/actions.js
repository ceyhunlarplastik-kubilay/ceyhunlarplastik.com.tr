import { lambdaHandler } from "@/core/middy";
import { materialRepository } from "@/core/helpers/prisma/materials/repository";
import { createMaterialHandler, deleteMaterialHandler, getMaterialHandler, listMaterialsHandler, updateMaterialHandler, } from "@/functions/AdminApi/functions/materials/handlers";
import { createMaterialValidator, idValidator, updateMaterialValidator, } from "@/functions/AdminApi/validators/materials";
export const listMaterials = lambdaHandler(async (event) => listMaterialsHandler({
    materialRepository: materialRepository(),
})(event), {
    auth: { requiredPermissionGroups: ["admin"] },
});
export const getMaterial = lambdaHandler(async (event) => getMaterialHandler({
    materialRepository: materialRepository(),
})(event), {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: idValidator,
});
export const createMaterial = lambdaHandler(async (event) => createMaterialHandler({
    materialRepository: materialRepository(),
})(event), {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createMaterialValidator,
});
export const updateMaterial = lambdaHandler(async (event) => updateMaterialHandler({
    materialRepository: materialRepository(),
})(event), {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: updateMaterialValidator,
});
export const deleteMaterial = lambdaHandler(async (event) => deleteMaterialHandler({
    materialRepository: materialRepository(),
})(event), {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: idValidator,
});
