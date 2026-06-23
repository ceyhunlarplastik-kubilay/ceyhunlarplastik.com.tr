import createError from "http-errors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapAdminUserForApi } from "@/functions/AdminApi/functions/users/handlers/mapAdminUserForApi"
import { IListUsersDependencies, IListUsersEvent } from "@/functions/ProtectedApi/types/users"

const ALLOWED_SORT_FIELDS = ["email", "identifier", "createdAt"] as const
const ALLOWED_ACCESS_STATUSES = new Set(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"])

export const listUsersHandler = ({ userRepository }: IListUsersDependencies) => {
  return async (event: IListUsersEvent) => {
    const requester = event.user
    if (!requester) throw new createError.Unauthorized("Authentication required")
    if (!requester.isSalesDirector && !requester.isAdmin && !requester.isOwner) {
      throw new createError.Forbidden("User listing access denied")
    }

    const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSort: "createdAt",
    })

    const accessStatusRaw = event.queryStringParameters?.accessStatus
    const accessStatus: UserAccessStatus | undefined =
      accessStatusRaw && ALLOWED_ACCESS_STATUSES.has(accessStatusRaw)
        ? accessStatusRaw as UserAccessStatus
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
    })
  }
}
