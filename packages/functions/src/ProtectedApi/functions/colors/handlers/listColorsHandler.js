import { apiResponse } from "@/core/helpers/utils/api/response";
export const listColorsHandler = ({ colorRepository }) => async () => {
    const colors = await colorRepository.listActiveColors();
    return apiResponse({
        statusCode: 200,
        payload: { colors },
    });
};
