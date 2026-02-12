import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types";
import { IListUsersDependencies } from "../../../types/users";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["email", "identifier", "createdAt"] as const

export const listUsersHandler =
  ({ userRepository }: IListUsersDependencies) =>
    async (event: IAPIGatewayProxyEventWithUser) => {
      const { page, limit, search, sort, order } =
        normalizeListQuery(event.queryStringParameters, {
          allowedSortFields: ALLOWED_SORT_FIELDS,
          defaultSort: "createdAt",
        })

      const result = await userRepository.listUsers({
        page,
        limit,
        search,
        sort,
        order,
      })

      return apiResponseDTO({
        statusCode: 200,
        payload: {
          data: result.data,
          meta: result.meta,
        },
      });
    };
