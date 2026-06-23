import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types";
import { IUsersDependencies } from "../../../types/users";
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import { mapAdminUserForApi } from "@/functions/AdminApi/functions/users/handlers/mapAdminUserForApi"

const ALLOWED_SORT_FIELDS = ["email", "identifier", "createdAt"] as const
const ALLOWED_ACCESS_STATUSES = new Set(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"])

export const listUsersHandler =
  ({ userRepository }: IUsersDependencies) =>
    async (event: IAPIGatewayProxyEventWithUser) => {
      const { page, limit, search, sort, order } =
        normalizeListQuery(event.queryStringParameters, {
          allowedSortFields: ALLOWED_SORT_FIELDS,
          defaultSort: "createdAt",
        })

      const accessStatusRaw = event.queryStringParameters?.accessStatus
      const accessStatus: UserAccessStatus | undefined =
        accessStatusRaw && ALLOWED_ACCESS_STATUSES.has(accessStatusRaw)
          ? (accessStatusRaw as UserAccessStatus)
          : undefined

      const result = await userRepository.listUsers({
        page,
        limit,
        search,
        sort,
        order,
        accessStatus,
      })

      return apiResponseDTO({
        statusCode: 200,
        payload: {
          data: result.data.map(mapAdminUserForApi),
          meta: result.meta,
        },
      });
    };
