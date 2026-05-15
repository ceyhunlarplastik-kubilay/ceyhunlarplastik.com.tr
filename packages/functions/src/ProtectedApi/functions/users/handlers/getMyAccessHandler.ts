import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetMyAccessDependencies, IGetMyAccessEvent } from "@/functions/ProtectedApi/types/users"

export const getMyAccessHandler =
    ({ userRepository }: IGetMyAccessDependencies) =>
        async (event: IGetMyAccessEvent) => {
            const authUser = event.user

            if (!authUser) {
                throw createError.Unauthorized("User context missing")
            }

            const user = await userRepository.getUserById(authUser.id)
            if (!user) {
                throw createError.NotFound("User not found")
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user,
                    canAccessPanels: user.accessStatus === "ACTIVE",
                },
            })
        }
