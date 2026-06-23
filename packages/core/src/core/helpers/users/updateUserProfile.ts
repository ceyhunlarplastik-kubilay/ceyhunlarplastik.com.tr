import createError from "http-errors"
import type { ICognitoUserRepository } from "@/core/helpers/cognito/users/repository"
import type {
    IPrismaUserRepository,
    UserWithRelations,
} from "@/core/helpers/prisma/users/repository"
import { buildUserDisplayName } from "@/core/helpers/users/displayName"
import { normalizePhoneNumberToE164 } from "@/core/helpers/validation/phone"

export type UserProfileUpdateInput = {
    email?: string
    identifier?: string
    firstName?: string
    lastName?: string
    phone?: string | null
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact?: boolean
}

type Params = {
    userId: string
    body: UserProfileUpdateInput
    userRepository: IPrismaUserRepository
    cognitoRepository: ICognitoUserRepository
    userPoolId: string
    expectedCognitoSub?: string
}

export async function updateUserProfile({
    userId,
    body,
    userRepository,
    cognitoRepository,
    userPoolId,
    expectedCognitoSub,
}: Params): Promise<UserWithRelations> {
    const user = await userRepository.getUserById(userId)
    if (!user) {
        throw new createError.NotFound("User not found")
    }

    if (expectedCognitoSub && user.cognitoSub !== expectedCognitoSub) {
        throw new createError.Forbidden("Authenticated user can only update their own profile")
    }

    const nextFirstName = body.firstName?.trim()
    const nextLastName = body.lastName?.trim()
    const nextEmail = body.email?.trim()
    const nextIdentifier = body.identifier?.trim()
    const nextCustomerContactTitle = body.customerContactTitle === undefined
        ? undefined
        : (body.customerContactTitle?.trim() || null)
    const nextCustomerContactDepartment = body.customerContactDepartment === undefined
        ? undefined
        : (body.customerContactDepartment?.trim() || null)
    const nextIsPrimaryCustomerContact = body.isPrimaryCustomerContact
    const rawNextPhone = body.phone === undefined
        ? undefined
        : (body.phone?.trim() || null)
    const nextPhone = rawNextPhone
        ? normalizePhoneNumberToE164(rawNextPhone)
        : rawNextPhone
    const nextFullName = nextFirstName && nextLastName
        ? buildUserDisplayName({
            firstName: nextFirstName,
            lastName: nextLastName,
        })
        : undefined

    if (rawNextPhone && !nextPhone) {
        throw new createError.BadRequest(
            "Telefon numarasi +90 555 123 45 67 veya uluslararasi E.164 formatinda girilmelidir.",
        )
    }

    if (nextEmail && nextEmail !== user.email) {
        const existing = await userRepository.getUserByEmail(nextEmail)
        if (existing && existing.id !== user.id) {
            throw new createError.Conflict("Another user already uses this email")
        }
    }

    if (nextIsPrimaryCustomerContact && !user.customerId) {
        throw new createError.BadRequest("Ana yetkili atanabilmesi icin kullanicinin bir portal musterisine bagli olmasi gerekir.")
    }

    await cognitoRepository.updateAttributes(
        userPoolId,
        user.cognitoSub,
        {
            ...(nextFirstName !== undefined ? { firstName: nextFirstName } : {}),
            ...(nextLastName !== undefined ? { lastName: nextLastName } : {}),
            ...(nextFullName !== undefined ? { name: nextFullName } : {}),
            ...(nextEmail !== undefined ? { email: nextEmail } : {}),
            ...(nextPhone !== undefined ? { phoneNumber: nextPhone } : {}),
        },
    )

    return userRepository.updateProfile(user.id, {
        ...(nextFirstName !== undefined ? { firstName: nextFirstName } : {}),
        ...(nextLastName !== undefined ? { lastName: nextLastName } : {}),
        ...(nextEmail !== undefined ? { email: nextEmail } : {}),
        ...(nextIdentifier !== undefined ? { identifier: nextIdentifier } : {}),
        ...(nextPhone !== undefined ? { phone: nextPhone } : {}),
        ...(nextCustomerContactTitle !== undefined ? { customerContactTitle: nextCustomerContactTitle } : {}),
        ...(nextCustomerContactDepartment !== undefined ? { customerContactDepartment: nextCustomerContactDepartment } : {}),
        ...(nextIsPrimaryCustomerContact !== undefined ? { isPrimaryCustomerContact: nextIsPrimaryCustomerContact } : {}),
    })
}
