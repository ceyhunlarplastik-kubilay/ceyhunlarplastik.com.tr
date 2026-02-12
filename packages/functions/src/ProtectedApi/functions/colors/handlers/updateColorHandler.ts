import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export const updateColorHandler =
    ({ colorRepository }: { colorRepository: IPrismaColorRepository }) =>
        async (event: any) => {
            const id = event.pathParameters?.id
            if (!id) throw createError.BadRequest("Missing color id")

            const color = await colorRepository.updateColor(id, event.body)

            return apiResponse({
                statusCode: 200,
                payload: { color },
            })
        }
