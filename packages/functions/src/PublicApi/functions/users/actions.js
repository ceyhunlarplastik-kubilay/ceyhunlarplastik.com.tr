import { lambdaHandler } from "@/core/middy";
import { userRepository } from "@/core/helpers/prisma/users/repository";
import { getUserHandler, listUsersHandler } from "@/functions/PublicApi/functions/users/handlers";
import { idValidator, getUserResponseValidator, listUsersResponseValidator } from "@/functions/PublicApi/validators/users";
export const getUser = lambdaHandler(async (event) => {
    const deps = {
        userRepository: userRepository(),
    };
    return getUserHandler(deps)(event);
}, {
    auth: false,
    requestValidator: idValidator,
    responseValidator: getUserResponseValidator
});
export const listUsers = lambdaHandler(async (event) => {
    const deps = {
        userRepository: userRepository(),
    };
    return listUsersHandler(deps)(event);
}, {
    auth: false,
    responseValidator: listUsersResponseValidator
});
