import { lambdaHandler } from "@/core/middy";
import { colorRepository } from "@/core/helpers/prisma/colors/repository";
import { listColorsHandler, getColorHandler } from "@/functions/PublicApi/functions/colors/handlers";
import { idValidator, colorResponseValidator, listColorResponseValidator } from "@/functions/PublicApi/validators/colors";
export const listColors = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return listColorsHandler(deps)(event);
}, {
    auth: false,
    responseValidator: listColorResponseValidator,
});
export const getColor = lambdaHandler(async (event) => {
    const deps = {
        colorRepository: colorRepository()
    };
    return getColorHandler(deps)(event);
}, {
    auth: false,
    requestValidator: idValidator,
    responseValidator: colorResponseValidator,
});
