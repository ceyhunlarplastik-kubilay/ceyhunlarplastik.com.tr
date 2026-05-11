import { apiResponse } from "@/core/helpers/utils/api/response"
import { IListUsersDependencies, IListUsersEvent} from "@/functions/ProtectedApi/types/users";

export const listUsersHandler = ({ userRepository }: IListUsersDependencies) => {
  return async (event: IListUsersEvent) => {
    void event
    const users = await userRepository.listUsers({
      page: 1,
      limit: 100,
    });

    return apiResponse({
      statusCode: 200,
      payload: { users },
    })
  }
}
