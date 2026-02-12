import { apiResponse } from "@/core/helpers/utils/api/response"
import { IListUsersDependencies, IListUsersEvent} from "@/functions/ProtectedApi/types/users";

export const listUsersHandler = ({ userRepository }: IListUsersDependencies) => {
  return async (event: IListUsersEvent) => {

    const users = await userRepository.listUsers();

    return apiResponse({
      statusCode: 200,
      payload: { users },
    })
  }
}
