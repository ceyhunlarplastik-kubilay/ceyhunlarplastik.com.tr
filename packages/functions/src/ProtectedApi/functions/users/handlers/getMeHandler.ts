import createError from "http-errors";
import { apiResponse } from "@/core/helpers/utils/api/response";
import { IGetMeDependencies, IGetMeEvent } from "@/functions/ProtectedApi/types/users";

export const getMeHandler =
    ({ userRepository }: IGetMeDependencies) =>
        async (event: IGetMeEvent) => {
            const authUser = event.user;

            if (!authUser) {
                throw createError.Unauthorized("User context missing");
            }

            const user = await userRepository.getUserById(authUser.id);

            if (!user) {
                throw createError.NotFound("User not found");
            }

            return apiResponse({
                statusCode: 200,
                payload: {
                    user,
                },
            });
        };
