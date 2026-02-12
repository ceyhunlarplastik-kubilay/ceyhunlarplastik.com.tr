import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IDeleteColorDependencies, IDeleteColorEvent } from "@/functions/AdminApi/types/colors"
import { Prisma } from "@/prisma/generated/prisma/client"

export const deleteColorHandler = ({ colorRepository }: IDeleteColorDependencies) => {
    return async (event: IDeleteColorEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("Color ID is required");

        try {
            // Soft delete is handled in the prisma extension, so we don't need to filter by isActive here
            const color = await colorRepository.deleteColor(id);

            return apiResponse({
                statusCode: 200,
                payload: { color },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2024") throw new createError.NotFound(`Color not found`);
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete color");
        }
    }
}
