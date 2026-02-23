import { lambdaHandler } from "@/core/middy"
import { colorRepository } from "@/core/helpers/prisma/colors/repository"
import { listColorsHandler, getColorHandler } from "@/functions/PublicApi/functions/colors/handlers";
import { idValidator, colorResponseValidator, listColorResponseValidator } from "@/functions/PublicApi/validators/colors"
import type { IColorDependencies, IGetColorEvent, IListColorsEvent } from "@/functions/PublicApi/types/colors"

export const listColors = lambdaHandler(
    async (event) => {
        const deps: IColorDependencies = {
            colorRepository: colorRepository()
        }

        return listColorsHandler(deps)(
            event as IListColorsEvent
        )
    },
    {
        auth: false,
        responseValidator: listColorResponseValidator,
    }
)

export const getColor = lambdaHandler(
    async (event) => {
        const deps: IColorDependencies = {
            colorRepository: colorRepository()
        }

        return getColorHandler(deps)(
            event as IGetColorEvent
        )
    },
    {
        auth: false,
        requestValidator: idValidator,
        responseValidator: colorResponseValidator,
    }
)
