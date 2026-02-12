import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export const getColorHandler =
    ({ colorRepository }: { colorRepository: IPrismaColorRepository }) =>
        async (event: any) => {
            const id = event.pathParameters?.id
            if (!id) throw createError.BadRequest("Missing color id")

            const color = await colorRepository.getColor(id)

            return apiResponse({
                statusCode: 200,
                payload: { color },
            })
        }
