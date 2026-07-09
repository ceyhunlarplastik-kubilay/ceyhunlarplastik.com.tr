import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IPrismaColorRepository } from "@/core/helpers/prisma/colors/repository"

export const listColorsHandler =
    ({ colorRepository }: { colorRepository: IPrismaColorRepository }) =>
        async () => {
            const colors = await colorRepository.listActiveColors()

            return apiResponseDTO({
                statusCode: 200,
                payload: { colors },
            })
        }
