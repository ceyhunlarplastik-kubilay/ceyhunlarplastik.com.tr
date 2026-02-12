import { lambdaHandler } from "@/core/middy"
import { colorRepository } from "@/core/helpers/prisma/colors/repository"
import {
    createColorHandler,
    listColorsHandler,
    getColorHandler,
    deleteColorHandler,
    updateColorHandler,
} from "@/functions/AdminApi/functions/colors/handlers";
import {
    createColorValidator,
    getColorValidator,
    deleteColorValidator,
    updateColorValidator,
    colorResponseValidator,
    listColorResponseValidator,
} from "@/functions/AdminApi/validators/colors"
import type {
    ICreateColorDependencies,
    ICreateColorEvent,
    IListColorsDependencies,
    IListColorsEvent,
    IGetColorDependencies,
    IGetColorEvent,
    IDeleteColorDependencies,
    IDeleteColorEvent,
    IUpdateColorDependencies,
    IUpdateColorEvent
} from "@/functions/AdminApi/types/colors"

export const createColor = lambdaHandler(
    async (event) => {
        const deps: ICreateColorDependencies = {
            colorRepository: colorRepository()
        }

        return createColorHandler(deps)(
            event as ICreateColorEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createColorValidator,
        responseValidator: colorResponseValidator,
    }
)

export const listColors = lambdaHandler(
    async (event) => {
        const deps: IListColorsDependencies = {
            colorRepository: colorRepository()
        }

        return listColorsHandler(deps)(
            event as IListColorsEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listColorResponseValidator,
    }
)

export const getColor = lambdaHandler(
    async (event) => {
        const deps: IGetColorDependencies = {
            colorRepository: colorRepository()
        }

        return getColorHandler(deps)(
            event as IGetColorEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: getColorValidator,
        responseValidator: colorResponseValidator,
    }
)

export const deleteColor = lambdaHandler(
    async (event) => {
        const deps: IDeleteColorDependencies = {
            colorRepository: colorRepository()
        }

        return deleteColorHandler(deps)(
            event as IDeleteColorEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: deleteColorValidator,
        responseValidator: colorResponseValidator,
    }
)

export const updateColor = lambdaHandler(
    async (event) => {
        const deps: IUpdateColorDependencies = {
            colorRepository: colorRepository()
        }
        return updateColorHandler(deps)(
            event as IUpdateColorEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateColorValidator,
        responseValidator: colorResponseValidator,
    }
)