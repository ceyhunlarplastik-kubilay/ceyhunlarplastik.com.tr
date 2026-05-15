import { apiResponse } from "@/core/helpers/utils/api/response";
export const listUsersHandler = ({ userRepository }) => {
    return async (event) => {
        void event;
        const users = await userRepository.listUsers({
            page: 1,
            limit: 100,
        });
        return apiResponse({
            statusCode: 200,
            payload: { users },
        });
    };
};
