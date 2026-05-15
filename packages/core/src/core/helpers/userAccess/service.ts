import createError from "http-errors"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import {
    ALL_USER_GROUPS,
    BUSINESS_USER_GROUPS,
    type IUserAccessUpdateDependencies,
    type UserGroup,
} from "@/core/helpers/userAccess/types"

function normalizeNextAccessStatus(group: UserGroup, accessStatus?: UserAccessStatus) {
    if (accessStatus) return accessStatus
    return group === "user" ? "PENDING_REVIEW" : "ACTIVE"
}

function assertRequesterCanAssignGroup(requester: IAuthenticatedUser, nextGroup: UserGroup) {
    if (requester.isOwner) return

    if (!requester.isAdmin) {
        throw createError.Forbidden("Only admin/owner can change user roles")
    }

    if (!(BUSINESS_USER_GROUPS as readonly UserGroup[]).includes(nextGroup)) {
        throw createError.Forbidden("Admin cannot assign privileged roles")
    }
}

export async function updateUserAccess(input: {
    requester: IAuthenticatedUser
    targetUserId: string
    nextGroup: UserGroup
    supplierId?: string | null
    customerId?: string | null
    reason?: string | null
    accessStatus?: UserAccessStatus
    deps: IUserAccessUpdateDependencies
}) {
    const {
        requester,
        targetUserId,
        nextGroup,
        supplierId,
        customerId,
        reason,
        accessStatus,
        deps,
    } = input

    assertRequesterCanAssignGroup(requester, nextGroup)

    const user = await deps.userRepository.getUserById(targetUserId)
    if (!user) throw createError.NotFound("User not found")

    if (user.id === requester.id && nextGroup !== "owner") {
        throw createError.Forbidden("Owner cannot remove own owner role")
    }

    if (nextGroup === "supplier") {
        if (!supplierId) {
            throw createError.BadRequest("supplierId is required for supplier role")
        }
        if (!deps.supplierRepository) {
            throw createError.InternalServerError("Supplier repository not configured")
        }
        const supplier = await deps.supplierRepository.getSupplier(supplierId)
        if (!supplier) throw createError.NotFound("Supplier not found")
    }

    if (nextGroup === "customer") {
        if (!customerId) {
            throw createError.BadRequest("customerId is required for customer role")
        }
        if (!deps.customerRepository) {
            throw createError.InternalServerError("Customer repository not configured")
        }
        const customer = await deps.customerRepository.getCustomer(customerId)
        if (!customer) throw createError.NotFound("Customer not found")
    }

    const nextAccessStatus = normalizeNextAccessStatus(nextGroup, accessStatus)
    const previousGroups = user.groups
    const previousAccessStatus = user.accessStatus
    const toRemove = ALL_USER_GROUPS.filter((group) => ![nextGroup].includes(group))

    for (const group of toRemove) {
        if (user.groups.includes(group)) {
            await deps.cognitoRepository.removeFromGroup(
                deps.userPoolId,
                user.cognitoSub,
                group,
            )
        }
    }

    if (!user.groups.includes(nextGroup)) {
        await deps.cognitoRepository.addToGroup(
            deps.userPoolId,
            user.cognitoSub,
            nextGroup,
        )
    }

    const changedAt = new Date()

    const updated = await deps.userRepository.updateAssignments(user.id, [nextGroup], {
        supplierId: nextGroup === "supplier" ? supplierId ?? null : null,
        customerId: nextGroup === "customer" ? customerId ?? null : null,
        accessStatus: nextAccessStatus,
        accessStatusChangedAt: changedAt,
        accessStatusChangedByUserId: requester.id,
        accessStatusReason: reason ?? null,
    })

    await deps.publishEvent({
        userId: updated.id,
        cognitoSub: updated.cognitoSub,
        email: updated.email,
        previousGroups,
        nextGroups: updated.groups,
        previousAccessStatus,
        nextAccessStatus: updated.accessStatus,
        reason: reason ?? null,
        changedByUserId: requester.id,
        changedByEmail: requester.email,
        changedAt: changedAt.toISOString(),
    })

    return updated
}
