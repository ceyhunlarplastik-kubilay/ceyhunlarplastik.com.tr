import { createHash, randomBytes } from "crypto"
import createError from "http-errors"
import type { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import type { IUserInvitationRepository } from "@/core/helpers/prisma/userInvitations/repository"
import type {
    IPrismaUserRepository,
    UserWithRelations,
} from "@/core/helpers/prisma/users/repository"
import { buildUserDisplayName } from "@/core/helpers/users/displayName"

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7

type InvitationUserLike = {
    id: string
    email: string
    identifier?: string | null
    firstName?: string | null
    lastName?: string | null
}

type SendCustomerPortalInvitationEmailInput = {
    to: string
    firstName?: string | null
    customerName: string
    invitedByName: string
    invitationUrl: string
    expiresAt: Date
}

type RequestedProfile = {
    firstName: string
    lastName: string
    customerContactTitle: string | null
    customerContactDepartment: string | null
    isPrimaryCustomerContact: boolean
}

type CreateInvitationParams = {
    customerId: string
    customerName: string
    requester: InvitationUserLike
    email: string
    firstName: string
    lastName: string
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact?: boolean
    frontendBaseUrl: string
    userPoolId: string
    userRepository: IPrismaUserRepository
    userInvitationRepository: IUserInvitationRepository
    cognitoRepository: ICognitoUserRepository
    sendInvitationEmail: (input: SendCustomerPortalInvitationEmailInput) => Promise<void>
}

type LookupInvitationParams = {
    token: string
    userInvitationRepository: IUserInvitationRepository
}

type AcceptInvitationParams = LookupInvitationParams & {
    password: string
    userPoolId: string
    userRepository: IPrismaUserRepository
    cognitoRepository: ICognitoUserRepository
}

type CustomerPortalInvitationSummary = {
    email: string
    customerName: string
    firstName: string | null
    lastName: string | null
    customerContactTitle: string | null
    customerContactDepartment: string | null
    isPrimaryCustomerContact: boolean
    expiresAt: string
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function normalizeOptionalText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

function normalizeRequestedProfile(input: {
    firstName: string
    lastName: string
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact?: boolean
}): RequestedProfile {
    const firstName = input.firstName.trim()
    const lastName = input.lastName.trim()

    if (!firstName || !lastName) {
        throw new createError.BadRequest("Davet icin ad ve soyad zorunludur.")
    }

    return {
        firstName,
        lastName,
        customerContactTitle: normalizeOptionalText(input.customerContactTitle),
        customerContactDepartment: normalizeOptionalText(input.customerContactDepartment),
        isPrimaryCustomerContact: input.isPrimaryCustomerContact === true,
    }
}

function buildInvitationToken() {
    return randomBytes(32).toString("hex")
}

/* function buildTemporaryPassword() {
    return `TestPassword123!${randomBytes(4).toString("hex")}Aa`
} */
function buildTemporaryPassword() {
    const randomPart = randomBytes(18)
        .toString("base64url")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 24)

    return `${randomPart}Aa1!`
}

function buildInvitationUrl(frontendBaseUrl: string, token: string) {
    const normalizedBaseUrl = frontendBaseUrl.trim().replace(/\/+$/, "")
    return `${normalizedBaseUrl}/auth/accept-invite?token=${encodeURIComponent(token)}`
}

function rethrowServiceError(error: unknown): never {
    if (createError.isHttpError(error)) {
        throw error
    }

    if (error instanceof Error) {
        if (error.name === "UsernameExistsException") {
            throw new createError.Conflict("Bu e-posta adresi icin zaten bir Cognito hesabi bulunuyor.")
        }

        if (error.name === "UserNotFoundException") {
            throw new createError.NotFound("Davet kullanicisi Cognito tarafinda bulunamadi.")
        }

        if (error.name === "InvalidPasswordException" || error.name === "InvalidParameterException") {
            throw new createError.BadRequest(error.message)
        }
    }
    console.error("HATA >>>>>>>>>>", error);
    throw new createError.InternalServerError("Musteri kullanici daveti islenemedi.")
}

export function hashCustomerPortalInvitationToken(token: string) {
    return createHash("sha256").update(token.trim()).digest("hex")
}

async function getUsableInvitation({
    token,
    userInvitationRepository,
}: LookupInvitationParams) {
    const normalizedToken = token.trim()
    if (!normalizedToken) {
        throw new createError.BadRequest("Davet baglantisi gecersiz.")
    }

    const invitation = await userInvitationRepository.findByTokenHash(hashCustomerPortalInvitationToken(normalizedToken))

    if (!invitation) {
        throw new createError.NotFound("Davet bulunamadi.")
    }

    if (invitation.acceptedAt) {
        throw new createError.Conflict("Bu davet daha once kullanildi.")
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
        throw new createError.Gone("Bu davetin suresi doldu.")
    }

    return invitation
}

function mapInvitationSummary(invitation: Awaited<ReturnType<typeof getUsableInvitation>>): CustomerPortalInvitationSummary {
    return {
        email: invitation.email,
        customerName: invitation.customer.companyName || invitation.customer.fullName,
        firstName: invitation.requestedFirstName ?? invitation.user.firstName ?? null,
        lastName: invitation.requestedLastName ?? invitation.user.lastName ?? null,
        customerContactTitle: invitation.requestedCustomerContactTitle ?? invitation.user.customerContactTitle ?? null,
        customerContactDepartment:
            invitation.requestedCustomerContactDepartment ?? invitation.user.customerContactDepartment ?? null,
        isPrimaryCustomerContact:
            invitation.requestedIsPrimaryCustomerContact || invitation.user.isPrimaryCustomerContact || false,
        expiresAt: invitation.expiresAt.toISOString(),
    }
}

export async function getCustomerPortalInvitation(
    params: LookupInvitationParams,
): Promise<CustomerPortalInvitationSummary> {
    const invitation = await getUsableInvitation(params)
    return mapInvitationSummary(invitation)
}

export async function createCustomerPortalUserInvitation({
    customerId,
    customerName,
    requester,
    email,
    firstName,
    lastName,
    customerContactTitle,
    customerContactDepartment,
    isPrimaryCustomerContact,
    frontendBaseUrl,
    userPoolId,
    userRepository,
    userInvitationRepository,
    cognitoRepository,
    sendInvitationEmail,
}: CreateInvitationParams) {
    const normalizedEmail = normalizeEmail(email)
    const requestedProfile = normalizeRequestedProfile({
        firstName,
        lastName,
        customerContactTitle,
        customerContactDepartment,
        isPrimaryCustomerContact,
    })
    const existingUser = await userRepository.getUserByEmail(normalizedEmail)
    const pendingInvitation = await userInvitationRepository.findPendingByCustomerAndEmail(customerId, normalizedEmail)

    if (existingUser) {
        const isSameCustomerPortalUser =
            existingUser.customerId === customerId && existingUser.groups.includes("customer")

        if (!isSameCustomerPortalUser) {
            throw new createError.Conflict("Bu e-posta adresi baska bir kullaniciya ait.")
        }

        if (!pendingInvitation) {
            throw new createError.Conflict("Bu e-posta adresi icin aktif portal kullanicisi zaten mevcut.")
        }
    }

    const token = buildInvitationToken()
    const tokenHash = hashCustomerPortalInvitationToken(token)
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS)
    const invitationUrl = buildInvitationUrl(frontendBaseUrl, token)
    const invitedByName = buildUserDisplayName(requester) || requester.email
    const requestedDisplayName = buildUserDisplayName({
        firstName: requestedProfile.firstName,
        lastName: requestedProfile.lastName,
        email: normalizedEmail,
    })

    let createdUserId: string | null = null
    let createdCognitoUsername: string | null = null

    const previousInvitationSnapshot = pendingInvitation
        ? {
            tokenHash: pendingInvitation.tokenHash,
            expiresAt: pendingInvitation.expiresAt,
            invitedByUserId: pendingInvitation.invitedByUserId,
            requestedFirstName: pendingInvitation.requestedFirstName,
            requestedLastName: pendingInvitation.requestedLastName,
            requestedCustomerContactTitle: pendingInvitation.requestedCustomerContactTitle,
            requestedCustomerContactDepartment: pendingInvitation.requestedCustomerContactDepartment,
            requestedIsPrimaryCustomerContact: pendingInvitation.requestedIsPrimaryCustomerContact,
        }
        : null

    try {
        const targetUser = existingUser
            ?? await (async () => {
                const createdCognitoUser = await cognitoRepository.createUser(userPoolId, {
                    username: normalizedEmail,
                    temporaryPassword: buildTemporaryPassword(),
                    // temporaryPassword: "TestPassword123!",
                    email: normalizedEmail,
                    firstName: requestedProfile.firstName,
                    lastName: requestedProfile.lastName,
                    name: requestedDisplayName,
                })
                createdCognitoUsername = createdCognitoUser.username

                const cognitoUser =
                    createdCognitoUser.cognitoSub
                        ? createdCognitoUser
                        : await cognitoRepository.getUser(userPoolId, normalizedEmail).then((response) => ({
                            username: normalizedEmail,
                            cognitoSub: response.UserAttributes?.find((attribute: { Name?: string; Value?: string }) => attribute.Name === "sub")?.Value ?? null,
                        }))

                if (!cognitoUser.cognitoSub) {
                    throw new createError.InternalServerError("Cognito davet kullanicisi olusturuldu ancak sub bilgisi okunamadi.")
                }

                await cognitoRepository.addToGroup(userPoolId, normalizedEmail, "customer")

                const createdUser = await userRepository.createUser({
                    cognitoSub: cognitoUser.cognitoSub,
                    email: normalizedEmail,
                    identifier: requestedDisplayName || normalizedEmail.split("@")[0] || normalizedEmail,
                    firstName: requestedProfile.firstName,
                    lastName: requestedProfile.lastName,
                    groups: ["customer"],
                    accessStatus: "ACTIVE",
                    accessStatusChangedAt: new Date(),
                    isActive: true,
                    customer: {
                        connect: { id: customerId },
                    },
                    customerContactTitle: requestedProfile.customerContactTitle,
                    customerContactDepartment: requestedProfile.customerContactDepartment,
                    isPrimaryCustomerContact: false,
                })
                createdUserId = createdUser.id

                return createdUser
            })()

        const invitation = pendingInvitation
            ? await userInvitationRepository.updateInvitation(pendingInvitation.id, {
                invitedByUser: {
                    connect: { id: requester.id },
                },
                tokenHash,
                expiresAt,
                requestedFirstName: requestedProfile.firstName,
                requestedLastName: requestedProfile.lastName,
                requestedCustomerContactTitle: requestedProfile.customerContactTitle,
                requestedCustomerContactDepartment: requestedProfile.customerContactDepartment,
                requestedIsPrimaryCustomerContact: requestedProfile.isPrimaryCustomerContact,
            })
            : await userInvitationRepository.createInvitation({
                user: {
                    connect: { id: targetUser.id },
                },
                customer: {
                    connect: { id: customerId },
                },
                invitedByUser: {
                    connect: { id: requester.id },
                },
                email: normalizedEmail,
                tokenHash,
                expiresAt,
                requestedFirstName: requestedProfile.firstName,
                requestedLastName: requestedProfile.lastName,
                requestedCustomerContactTitle: requestedProfile.customerContactTitle,
                requestedCustomerContactDepartment: requestedProfile.customerContactDepartment,
                requestedIsPrimaryCustomerContact: requestedProfile.isPrimaryCustomerContact,
            })

        await sendInvitationEmail({
            to: normalizedEmail,
            firstName: requestedProfile.firstName,
            customerName,
            invitedByName,
            invitationUrl,
            expiresAt,
        })

        return {
            invitationId: invitation.id,
            userId: targetUser.id,
        }
    } catch (error) {
        if (pendingInvitation && previousInvitationSnapshot) {
            try {
                await userInvitationRepository.updateInvitation(pendingInvitation.id, {
                    tokenHash: previousInvitationSnapshot.tokenHash,
                    expiresAt: previousInvitationSnapshot.expiresAt,
                    invitedByUser: {
                        connect: { id: previousInvitationSnapshot.invitedByUserId },
                    },
                    requestedFirstName: previousInvitationSnapshot.requestedFirstName,
                    requestedLastName: previousInvitationSnapshot.requestedLastName,
                    requestedCustomerContactTitle: previousInvitationSnapshot.requestedCustomerContactTitle,
                    requestedCustomerContactDepartment: previousInvitationSnapshot.requestedCustomerContactDepartment,
                    requestedIsPrimaryCustomerContact: previousInvitationSnapshot.requestedIsPrimaryCustomerContact,
                })
            } catch (rollbackError) {
                console.error("Failed to rollback updated customer invitation", rollbackError)
            }
        }

        if (createdUserId) {
            try {
                await userRepository.deleteUser(createdUserId)
            } catch (rollbackError) {
                console.error("Failed to rollback invited DB user", rollbackError)
            }
        }

        if (createdCognitoUsername) {
            try {
                await cognitoRepository.deleteUser(userPoolId, createdCognitoUsername)
            } catch (rollbackError) {
                console.error("Failed to rollback invited Cognito user", rollbackError)
            }
        }

        rethrowServiceError(error)
    }
}

export async function acceptCustomerPortalInvitation({
    token,
    password,
    userPoolId,
    userRepository,
    userInvitationRepository,
    cognitoRepository,
}: AcceptInvitationParams) {
    const invitation = await getUsableInvitation({
        token,
        userInvitationRepository,
    })
    const user = await userRepository.getUserById(invitation.user.id)

    if (!user) {
        throw new createError.NotFound("Davet kullanicisi veritabaninda bulunamadi.")
    }

    if (user.customerId !== invitation.customer.id || !user.groups.includes("customer")) {
        throw new createError.Conflict("Davet kullanicisi musteri portali ile eslesmiyor.")
    }

    const nextFirstName = invitation.requestedFirstName ?? user.firstName ?? null
    const nextLastName = invitation.requestedLastName ?? user.lastName ?? null
    const nextDisplayName = buildUserDisplayName({
        firstName: nextFirstName,
        lastName: nextLastName,
        identifier: user.identifier,
        email: user.email,
    })
    const acceptedAt = new Date()

    try {
        await cognitoRepository.setPermanentPassword(userPoolId, user.cognitoSub, password)

        await cognitoRepository.updateAttributes(userPoolId, user.cognitoSub, {
            ...(nextFirstName !== null ? { firstName: nextFirstName } : {}),
            ...(nextLastName !== null ? { lastName: nextLastName } : {}),
            ...(nextDisplayName ? { name: nextDisplayName } : {}),
        })

        const updatedUser = await userRepository.updateProfile(user.id, {
            ...(nextFirstName !== null ? { firstName: nextFirstName } : {}),
            ...(nextLastName !== null ? { lastName: nextLastName } : {}),
            ...(nextDisplayName ? { identifier: nextDisplayName } : {}),
            customerContactTitle: invitation.requestedCustomerContactTitle ?? null,
            customerContactDepartment: invitation.requestedCustomerContactDepartment ?? null,
            isPrimaryCustomerContact: invitation.requestedIsPrimaryCustomerContact,
        })

        await userInvitationRepository.markAccepted(invitation.id, acceptedAt)

        return {
            user: updatedUser,
            invitation: mapInvitationSummary(invitation),
        }
    } catch (error) {
        rethrowServiceError(error)
    }
}
