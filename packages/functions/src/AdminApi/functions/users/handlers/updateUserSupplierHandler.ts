import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IUpdateUserSupplierEvent,
    IUsersDependencies,
} from "@/functions/AdminApi/types/users"

export const updateUserSupplierHandler =
    ({ userRepository, supplierRepository }: IUsersDependencies) =>
        async (event: IUpdateUserSupplierEvent) => {
            if (!supplierRepository) {
                throw new createError.InternalServerError("Supplier repository not configured")
            }
            const requester = event.user
            if (!requester?.isOwner && !requester?.isAdmin) {
                throw new createError.Forbidden("Only admin/owner can update supplier assignment")
            }

            const { id } = event.pathParameters
            const { supplierId } = event.body ?? {}

            const user = await userRepository.getUserById(id)
            if (!user) {
                throw new createError.NotFound("User not found")
            }

            if (supplierId) {
                const supplier = await supplierRepository.getSupplier(supplierId)
                if (!supplier) {
                    throw new createError.NotFound("Supplier not found")
                }
            }

            const updated = await userRepository.updateGroupsAndSupplier(
                user.id,
                user.groups,
                supplierId ?? null
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: { user: updated },
            })
        }
