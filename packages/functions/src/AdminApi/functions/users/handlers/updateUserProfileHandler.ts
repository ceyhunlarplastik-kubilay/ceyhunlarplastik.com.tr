import createError from "http-errors"
import { buildUserDisplayName } from "@/core/helpers/users/displayName"
import { normalizePhoneNumberToE164 } from "@/core/helpers/validation/phone"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapAdminUserForApi } from "@/functions/AdminApi/functions/users/handlers/mapAdminUserForApi"
import type {
    IUpdateUserProfileEvent,
    IUpdateUserRoleDependencies,
} from "@/functions/AdminApi/types/users"

export const updateUserProfileHandler =
    (deps: IUpdateUserRoleDependencies) =>
        async (event: IUpdateUserProfileEvent) => {
            const requester = event.user
            if (!requester?.isOwner && !requester?.isAdmin) {
                throw new createError.Forbidden("Only admin/owner can update user profiles")
            }

            const { id } = event.pathParameters
            const user = await deps.userRepository.getUserById(id)
            if (!user) {
                throw new createError.NotFound("User not found")
            }

            const nextFirstName = event.body.firstName?.trim()
            const nextLastName = event.body.lastName?.trim()
            const nextEmail = event.body.email?.trim()
            const nextIdentifier = event.body.identifier?.trim()
            const nextCustomerContactTitle = event.body.customerContactTitle === undefined
                ? undefined
                : (event.body.customerContactTitle?.trim() || null)
            const nextCustomerContactDepartment = event.body.customerContactDepartment === undefined
                ? undefined
                : (event.body.customerContactDepartment?.trim() || null)
            const nextIsPrimaryCustomerContact = event.body.isPrimaryCustomerContact
            const rawNextPhone = event.body.phone === undefined
                ? undefined
                : (event.body.phone?.trim() || null)
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
                const existing = await deps.userRepository.getUserByEmail(nextEmail)
                if (existing && existing.id !== user.id) {
                    throw new createError.Conflict("Another user already uses this email")
                }
            }

            if (nextIsPrimaryCustomerContact && !user.customerId) {
                throw new createError.BadRequest("Ana yetkili atanabilmesi icin kullanicinin bir portal musterisine bagli olmasi gerekir.")
            }

            await deps.cognitoRepository.updateAttributes(
                deps.userPoolId,
                user.cognitoSub,
                {
                    ...(nextFirstName !== undefined ? { firstName: nextFirstName } : {}),
                    ...(nextLastName !== undefined ? { lastName: nextLastName } : {}),
                    ...(nextFullName !== undefined ? { name: nextFullName } : {}),
                    ...(nextEmail !== undefined ? { email: nextEmail } : {}),
                    ...(nextPhone !== undefined ? { phoneNumber: nextPhone } : {}),
                },
            )

            const updated = await deps.userRepository.updateProfile(user.id, {
                ...(nextFirstName !== undefined ? { firstName: nextFirstName } : {}),
                ...(nextLastName !== undefined ? { lastName: nextLastName } : {}),
                ...(nextEmail !== undefined ? { email: nextEmail } : {}),
                ...(nextIdentifier !== undefined ? { identifier: nextIdentifier } : {}),
                ...(nextPhone !== undefined ? { phone: nextPhone } : {}),
                ...(nextCustomerContactTitle !== undefined ? { customerContactTitle: nextCustomerContactTitle } : {}),
                ...(nextCustomerContactDepartment !== undefined ? { customerContactDepartment: nextCustomerContactDepartment } : {}),
                ...(nextIsPrimaryCustomerContact !== undefined ? { isPrimaryCustomerContact: nextIsPrimaryCustomerContact } : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    user: mapAdminUserForApi(updated),
                },
            })
        }
