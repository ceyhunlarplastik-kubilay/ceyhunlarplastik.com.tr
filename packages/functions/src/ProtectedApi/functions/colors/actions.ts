import { lambdaHandler } from "@/core/middy"
import { colorRepository } from "@/core/helpers/prisma/colors/repository"
import {
    createColorValidator,
    updateColorValidator,
    getColorValidator,
    colorResponseValidator,
    listColorResponseValidator,
} from "../../validators/colors"
import {
    listColorsHandler,
    getColorHandler,
    createColorHandler,
    updateColorHandler,
} from "./handlers"

export const listColors = lambdaHandler(
    async () => listColorsHandler({ colorRepository: colorRepository() })(),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listColorResponseValidator,
    },
)

export const getColor = lambdaHandler(
    async (event) => getColorHandler({ colorRepository: colorRepository() })(event),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: getColorValidator,
        responseValidator: colorResponseValidator,
    },
)

export const createColor = lambdaHandler(
    async (event) =>
        createColorHandler({ colorRepository: colorRepository() })(event),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createColorValidator,
        responseValidator: colorResponseValidator,
    },
)

export const updateColor = lambdaHandler(
    async (event) =>
        updateColorHandler({ colorRepository: colorRepository() })(event),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateColorValidator,
        responseValidator: colorResponseValidator,
    },
)
