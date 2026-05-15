import createError from "http-errors";
import { apiResponse } from "@/core/helpers/utils/api/response";
export const getColorHandler = ({ colorRepository }) => async (event) => {
    const id = event.pathParameters?.id;
    if (!id)
        throw createError.BadRequest("Missing color id");
    const color = await colorRepository.getColor(id);
    return apiResponse({
        statusCode: 200,
        payload: { color },
    });
};
