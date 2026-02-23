import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IColorDependencies, IGetColorEvent } from "@/functions/PublicApi/types/colors"

export const getColorHandler = ({ colorRepository }: IColorDependencies) => {
    return async (event: IGetColorEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("Color id is required");

        try {
            const color = await colorRepository.getColor(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { color },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Color not found");
            throw new createError.InternalServerError("Failed to get color");
        }
    }
}
