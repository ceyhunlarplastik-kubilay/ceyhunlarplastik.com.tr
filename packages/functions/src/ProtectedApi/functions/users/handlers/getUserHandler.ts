import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IGetUserDependencies, IGetUserEvent} from "@/functions/ProtectedApi/types/users";

export const getUserHandler = ({ userRepository }: IGetUserDependencies) => {
  return async (event: IGetUserEvent) => {
    const id = event.pathParameters?.id

    if (!id) {
      throw createError.BadRequest("Missing path parameter: id")
    }

    const user = await userRepository.getUserById(id)

    if (!user) {
      throw createError.NotFound("User not found")
    }

    return apiResponse({
      statusCode: 200,
      payload: { user },
    })
  }
}
