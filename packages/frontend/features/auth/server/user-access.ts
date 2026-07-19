"use server"

import { prisma } from "@core/db/prisma"
import { getUserDisplayName } from "@/lib/users/displayName"

export type AuthUserAccessState = {
    dbUserId: string
    identifier: string
    firstName?: string | null
    lastName?: string | null
    displayName: string
    imageUrl?: string | null
    groups: string[]
    accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    customerId?: string | null
    supplierId?: string | null
    isActive: boolean
}

export async function getAuthUserAccessStateByCognitoSub(cognitoSub: string) {
    const buildUserImageUrl = (key?: string | null) => {
        if (!key) return null

        const base = process.env.ASSET_PUBLIC_BASE_URL?.replace(/\/$/, "")
        return base ? `${base}/${key}` : null
    }

    const user = await prisma.user.findUnique({
        where: {
            cognitoSub,
        },
        select: {
            id: true,
            email: true,
            identifier: true,
            firstName: true,
            lastName: true,
            imageKey: true,
            groups: true,
            accessStatus: true,
            customerId: true,
            supplierId: true,
            isActive: true,
        },
    })

    if (!user) {
        return null
    }

    return {
        dbUserId: user.id,
        identifier: user.identifier,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: getUserDisplayName(user),
        imageUrl: buildUserImageUrl(user.imageKey),
        groups: user.groups,
        accessStatus: user.accessStatus,
        customerId: user.customerId ?? null,
        supplierId: user.supplierId ?? null,
        isActive: user.isActive,
    } satisfies AuthUserAccessState
}
