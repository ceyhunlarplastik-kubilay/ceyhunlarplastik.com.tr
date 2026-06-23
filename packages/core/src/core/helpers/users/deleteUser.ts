import createError from "http-errors"
import type { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import type {
    IPrismaUserRepository,
    UserDeletionBlockers,
} from "@/core/helpers/prisma/users/repository"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

type DeleteUserParams = {
    userId: string
    requester: IAuthenticatedUser
    userRepository: IPrismaUserRepository
    cognitoRepository: ICognitoUserRepository
    userPoolId: string
}

function getBlockingLabels(blockers: UserDeletionBlockers) {
    const labels: string[] = []

    if (blockers.sentCustomerInvitations > 0) {
        labels.push("musteri portali davet gecmisi")
    }

    if (blockers.requestedBusinessRequests > 0) {
        labels.push("is talebi gecmisi")
    }

    if (blockers.createdCustomerFeaturedProducts > 0) {
        labels.push("onecikan urun kayitlari")
    }

    if (blockers.createdCustomerAssignedProducts > 0) {
        labels.push("atanan varyant kayitlari")
    }

    if (blockers.ownedCustomerVisits > 0 || blockers.createdCustomerVisits > 0) {
        labels.push("musteri ziyaret kayitlari")
    }

    if (blockers.createdCustomerSpecialPrices > 0) {
        labels.push("ozel fiyat kayitlari")
    }

    return labels
}

function isCognitoUserNotFoundError(error: unknown) {
    return error instanceof Error && error.name === "UserNotFoundException"
}

export async function deleteUser({
    userId,
    requester,
    userRepository,
    cognitoRepository,
    userPoolId,
}: DeleteUserParams) {
    if (!requester.isAdmin && !requester.isOwner) {
        throw new createError.Forbidden("Only admin/owner can delete users")
    }

    const user = await userRepository.getUserById(userId)
    if (!user) {
        throw new createError.NotFound("User not found")
    }

    if (user.id === requester.id) {
        throw new createError.Forbidden("Kendi hesabinizi silemezsiniz.")
    }

    if (user.groups.includes("owner")) {
        throw new createError.Forbidden("Owner kullanicilari silinemez.")
    }

    if (!requester.isOwner && user.groups.includes("admin")) {
        throw new createError.Forbidden("Admin kullanicilari yalnizca owner silebilir.")
    }

    const blockers = await userRepository.getDeletionBlockers(user.id)
    const blockingLabels = getBlockingLabels(blockers)

    if (blockingLabels.length > 0) {
        throw new createError.Conflict(
            `Bu kullanici silinemez. Once iliskili kayitlari temizleyin: ${blockingLabels.join(", ")}.`,
        )
    }

    try {
        await cognitoRepository.deleteUser(userPoolId, user.cognitoSub)
    } catch (error) {
        if (!isCognitoUserNotFoundError(error)) {
            throw error
        }
    }

    try {
        await userRepository.deleteUser(user.id)
    } catch (error) {
        console.error("Failed to delete user from database after Cognito deletion", error)
        throw new createError.InternalServerError(
            "Kullanici Cognito'dan silindi ancak veritabani kaydi temizlenemedi.",
        )
    }

    return {
        deletedUserId: user.id,
    }
}
