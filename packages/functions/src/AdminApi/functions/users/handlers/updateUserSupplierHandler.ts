import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IUpdateUserSupplierEvent,
    IUsersDependencies,
} from "@/functions/AdminApi/types/users"

export const updateUserSupplierHandler =
    ({ userRepository, supplierRepository, customerRepository }: IUsersDependencies) =>
        async (event: IUpdateUserSupplierEvent) => {
            if (!supplierRepository) {
                throw new createError.InternalServerError("Supplier repository not configured")
            }
            if (!customerRepository) {
                throw new createError.InternalServerError("Customer repository not configured")
            }
            const requester = event.user
            if (!requester?.isOwner && !requester?.isAdmin) {
                throw new createError.Forbidden("Only admin/owner can update user assignments")
            }

            const { id } = event.pathParameters
            const {
                supplierId,
                customerId,
                assignedSupplierIds,
                assignedCustomerIds,
            } = event.body ?? {}

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

            if (customerId) {
                const customer = await customerRepository.getCustomer(customerId)
                if (!customer) {
                    throw new createError.NotFound("Customer not found")
                }
            }

            if (assignedSupplierIds?.length) {
                const suppliers = await Promise.all(
                    assignedSupplierIds.map((supplierIdItem) => supplierRepository.getSupplier(supplierIdItem))
                )
                if (suppliers.some((supplier) => !supplier)) {
                    throw new createError.NotFound("One or more assigned suppliers were not found")
                }
            }

            if (assignedCustomerIds?.length) {
                const customers = await Promise.all(
                    assignedCustomerIds.map((customerIdItem) => customerRepository.getCustomer(customerIdItem))
                )
                if (customers.some((customer) => !customer)) {
                    throw new createError.NotFound("One or more assigned customers were not found")
                }
            }

            const updated = await userRepository.updateAssignments(
                user.id,
                user.groups,
                {
                    supplierId: supplierId ?? null,
                    customerId: customerId ?? null,
                    assignedSupplierIds,
                    assignedCustomerIds,
                },
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: { user: updated },
            })
        }
