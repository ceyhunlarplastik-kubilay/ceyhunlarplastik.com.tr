import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IColorDependencies, IDeleteColorEvent } from "@/functions/AdminApi/types/colors"
import { Prisma } from "@/prisma/generated/prisma/client"

export const deleteColorHandler = ({ colorRepository }: IColorDependencies) => {
    return async (event: IDeleteColorEvent) => {
        const { id } = event.pathParameters;

        try {
            // Soft delete is handled in the prisma extension, so we don't need to filter by isActive here
            const color = await colorRepository.deleteColor(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { color },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2024") throw new createError.NotFound(`Color not found`);
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete color");
        }
    }
}
