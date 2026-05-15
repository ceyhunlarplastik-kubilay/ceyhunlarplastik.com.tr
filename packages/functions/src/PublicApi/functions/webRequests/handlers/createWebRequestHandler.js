import createError, { HttpError } from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const createWebRequestHandler = ({ webRequestRepository }) => {
    return async (event) => {
        const { name, email, phone, message, items } = event.body;
        try {
            const request = await webRequestRepository.createWebRequest({
                name,
                email,
                phone,
                message,
                items,
            });
            return apiResponseDTO({
                statusCode: 201,
                payload: {
                    request,
                },
            });
        }
        catch (error) {
            if (error instanceof HttpError)
                throw error;
            console.error(error);
            throw new createError.InternalServerError("Failed to create web request");
        }
    };
};
