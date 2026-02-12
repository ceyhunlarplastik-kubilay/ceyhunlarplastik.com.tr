import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { ICreateUserDependencies, ICreateUserEvent } from "@/functions/PublicApi/types/users"

export const createUserHandler = ({ userRepository }: ICreateUserDependencies) => {
    return async (event: ICreateUserEvent) => {
        const body = event.body

        if (!body || !body.email) {
            throw createError.BadRequest("Email is required")
        }

        const user = await userRepository.createUser({
            email: body.email,
            identifier: body.email.split("@")[0],
            cognitoSub: "public", // 👈 public API olduğu için
            groups: ["user"],
            isActive: true,
        })

        return apiResponse({
            statusCode: 201,
            payload: { user },
        })
    }
}
