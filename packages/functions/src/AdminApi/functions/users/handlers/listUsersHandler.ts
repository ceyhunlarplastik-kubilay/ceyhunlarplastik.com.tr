import { apiResponse } from "@/core/helpers/utils/api/response";
import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types";
import { IListUsersDependencies } from "../../../types/users";

export const listUsersHandler =
  ({ userRepository }: IListUsersDependencies) =>
  async (event: IAPIGatewayProxyEventWithUser) => {
    const users = await userRepository.listUsers();

    return apiResponse({
      statusCode: 200,
      payload: {
        users
      },
    });
  };
