import createError from "http-errors"
import { apiResponse } from "@/core/helpers/utils/api/response"
import { IGetColorDependencies, IGetColorEvent } from "@/functions/AdminApi/types/colors"

export const getColorHandler = ({ colorRepository }: IGetColorDependencies) => {
    return async (event: IGetColorEvent) => {
        const id = event.pathParameters?.id;

        if (!id) throw new createError.BadRequest("Color ID is required");

        try {
            // Soft delete is handled in the prisma extension, so we don't need to filter by isActive here
            const color = await colorRepository.getColor(id);

            if (!color) throw new createError.NotFound("Color not found");

            return apiResponse({
                statusCode: 200,
                payload: { color },
            })
        } catch (err: any) {
            console.error(err);
            throw new createError.InternalServerError("Failed to delete color");
        }
    }
}
