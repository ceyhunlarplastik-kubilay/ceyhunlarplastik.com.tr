import { randomBytes } from "crypto"
import {
    AdminCreateUserCommand,
    AdminLinkProviderForUserCommand,
    AdminSetUserPasswordCommand,
    CognitoIdentityProviderClient,
    ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import type { FederationRepository } from "./handlePreSignUp"

// `Filter` değeri çift tırnaklı bir dizgedir; tırnak/ters bölü içeren bir adres zaten geçerli
// bir e-posta değildir — kaçış yazmak yerine reddederiz.
const FILTER_SAFE_EMAIL = /^[^\s"\\]+@[^\s"\\]+$/

/**
 * Kullanıcının ASLA bilmeyeceği parola: yerel profil yalnız federe kimliğin "çapası".
 * `AdminCreateUser` profili FORCE_CHANGE_PASSWORD bırakır; kalıcı bir parola vermek onu
 * CONFIRMED yapar — böylece kullanıcı sonradan "Şifremi unuttum" ile kendi parolasını
 * belirleyebilir.
 */
function buildUnknowablePassword() {
    const randomPart = randomBytes(24)
        .toString("base64url")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 28)

    return `${randomPart}Aa1!`
}

// Bölge Lambda çalışma zamanından gelir (`AWS_REGION`).
export function cognitoFederationRepository(
    client = new CognitoIdentityProviderClient({}),
): FederationRepository {
    return {
        async listUsersByEmail(userPoolId, email) {
            if (!FILTER_SAFE_EMAIL.test(email)) {
                throw new Error("Unsafe email address for Cognito ListUsers filter")
            }

            const response = await client.send(
                new ListUsersCommand({
                    UserPoolId: userPoolId,
                    Filter: `email = "${email}"`,
                    Limit: 10,
                }),
            )

            return (response.Users ?? []).flatMap((user) =>
                user.Username ? [{ username: user.Username, status: user.UserStatus ?? "UNKNOWN" }] : [],
            )
        },

        async createLocalUser(userPoolId, input) {
            const created = await client.send(
                new AdminCreateUserCommand({
                    UserPoolId: userPoolId,
                    Username: input.email,
                    TemporaryPassword: buildUnknowablePassword(),
                    MessageAction: "SUPPRESS",
                    UserAttributes: [
                        { Name: "email", Value: input.email },
                        { Name: "email_verified", Value: "true" },
                        ...(input.firstName ? [{ Name: "given_name", Value: input.firstName }] : []),
                        ...(input.lastName ? [{ Name: "family_name", Value: input.lastName }] : []),
                        ...(input.name ? [{ Name: "name", Value: input.name }] : []),
                    ],
                }),
            )

            const username = created.User?.Username
            if (!username) throw new Error("AdminCreateUser returned no username")

            await client.send(
                new AdminSetUserPasswordCommand({
                    UserPoolId: userPoolId,
                    Username: username,
                    Password: buildUnknowablePassword(),
                    Permanent: true,
                }),
            )

            return { username }
        },

        async linkProvider(userPoolId, input) {
            await client.send(
                new AdminLinkProviderForUserCommand({
                    UserPoolId: userPoolId,
                    DestinationUser: {
                        ProviderName: "Cognito",
                        ProviderAttributeValue: input.nativeUsername,
                    },
                    SourceUser: {
                        ProviderName: input.providerName,
                        // Sosyal sağlayıcılarda bağlama SABİT `Cognito_Subject` özniteliğiyle yapılır.
                        ProviderAttributeName: "Cognito_Subject",
                        ProviderAttributeValue: input.providerUserId,
                    },
                }),
            )
        },
    }
}
