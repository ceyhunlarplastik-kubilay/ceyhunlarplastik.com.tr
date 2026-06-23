import { prisma } from "@/core/db/prisma"
import type { Prisma } from "@/prisma/generated/prisma/client"

const invitationUserSelect = {
    id: true,
    cognitoSub: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
    customerId: true,
    customerContactTitle: true,
    customerContactDepartment: true,
    isPrimaryCustomerContact: true,
} as const

const invitationCustomerSelect = {
    id: true,
    companyName: true,
    fullName: true,
} as const

const invitationInviterSelect = {
    id: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
} as const

const userInvitationInclude = {
    user: {
        select: invitationUserSelect,
    },
    customer: {
        select: invitationCustomerSelect,
    },
    invitedByUser: {
        select: invitationInviterSelect,
    },
} satisfies Prisma.UserInvitationInclude

export type UserInvitationRecord = Prisma.UserInvitationGetPayload<{
    include: typeof userInvitationInclude
}>

export interface IUserInvitationRepository {
    findByTokenHash(tokenHash: string): Promise<UserInvitationRecord | null>
    findPendingByCustomerAndEmail(customerId: string, email: string): Promise<UserInvitationRecord | null>
    createInvitation(data: Prisma.UserInvitationCreateInput): Promise<UserInvitationRecord>
    updateInvitation(id: string, data: Prisma.UserInvitationUpdateInput): Promise<UserInvitationRecord>
    markAccepted(id: string, acceptedAt: Date): Promise<UserInvitationRecord>
}

export const userInvitationRepository = (): IUserInvitationRepository => {
    const findByTokenHash = async (tokenHash: string) =>
        prisma.userInvitation.findUnique({
            where: { tokenHash },
            include: userInvitationInclude,
        })

    const findPendingByCustomerAndEmail = async (customerId: string, email: string) =>
        prisma.userInvitation.findFirst({
            where: {
                customerId,
                email,
                acceptedAt: null,
            },
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            include: userInvitationInclude,
        })

    const createInvitation = async (data: Prisma.UserInvitationCreateInput) =>
        prisma.userInvitation.create({
            data,
            include: userInvitationInclude,
        })

    const updateInvitation = async (id: string, data: Prisma.UserInvitationUpdateInput) =>
        prisma.userInvitation.update({
            where: { id },
            data,
            include: userInvitationInclude,
        })

    const markAccepted = async (id: string, acceptedAt: Date) =>
        prisma.userInvitation.update({
            where: { id },
            data: {
                acceptedAt,
            },
            include: userInvitationInclude,
        })

    return {
        findByTokenHash,
        findPendingByCustomerAndEmail,
        createInvitation,
        updateInvitation,
        markAccepted,
    }
}
