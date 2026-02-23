import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IUsersDependencies, IGetUserEvent } from "@/functions/AdminApi/types/users"

export const getUserHandler = ({ userRepository }: IUsersDependencies) => {
    return async (event: IGetUserEvent) => {
        const { id } = event.pathParameters;

        try {
            // Soft delete is handled in the prisma extension, so we don't need to filter by isActive here
            const user = await userRepository.getUserById(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { user },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("User not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get user");
        }
    }
}
