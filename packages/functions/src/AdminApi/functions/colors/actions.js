import { lambdaHandler } from "@/core/middy";
import { colorRepository } from "@/core/helpers/prisma/colors/repository";
import { createColorHandler, listColorsHandler, getColorHandler, deleteColorHandler, updateColorHandler, } from "@/functions/AdminApi/functions/colors/handlers";
import { createColorValidator, getColorValidator, deleteColorValidator, updateColorValidator, colorResponseValidator, listColorResponseValidator, } from "@/functions/AdminApi/validators/colors";
export const createColor = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return createColorHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: createColorValidator,
    responseValidator: colorResponseValidator,
});
export const listColors = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return listColorsHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    responseValidator: listColorResponseValidator,
});
export const getColor = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return getColorHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: getColorValidator,
    responseValidator: colorResponseValidator,
});
export const deleteColor = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return deleteColorHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: deleteColorValidator,
    responseValidator: colorResponseValidator,
});
export const updateColor = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return updateColorHandler(deps)(event);
}, {
    auth: { requiredPermissionGroups: ["admin"] },
    requestValidator: updateColorValidator,
    responseValidator: colorResponseValidator,
});
