import createError from "http-errors";
import { apiResponse } from "@/core/helpers/utils/api/response";
export const getMeHandler = ({ userRepository }) => async (event) => {
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
