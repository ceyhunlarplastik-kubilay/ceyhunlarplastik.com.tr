import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { IListUsersDependencies } from "@/functions/PublicApi/types/users"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

const ALLOWED_SORT_FIELDS = ["name", "createdAt"] as const

export const listUsersHandler = ({ userRepository }: IListUsersDependencies) => {
    return async (event: APIGatewayProxyEventV2) => {

        const { page, limit, search, sort, order } =
            normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ALLOWED_SORT_FIELDS,
                defaultSort: "createdAt",
            })

        try {
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
            })
        } catch (err) {
            console.error(err)
            throw new createError.InternalServerError("An error occurred while listing users");
        }
    }
}
