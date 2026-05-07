import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { CognitoAuthError, toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"
import { getCognitoProfileFromIdToken } from "@/lib/auth/cognito-tokens"

export type SignInResult = {
    id: string
    email: string
    name?: string
    image?: string
    groups: string[]
    idToken: string
    accessToken: string
    refreshToken?: string
    expiresAt: number
}

export async function signInWithCognito(email: string, password: string): Promise<SignInResult> {
    try {
        const client = getCognitoClient()
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID!,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: computeSecretHash(email),
            },
        })

        const response = await client.send(command)

        if (response.ChallengeName) {
            throw new CognitoAuthError(
                "UNSUPPORTED_CHALLENGE",
                response.ChallengeName === "NEW_PASSWORD_REQUIRED"
                    ? "İlk girişte zorunlu şifre değişimi bu sürümde desteklenmiyor."
                    : "Bu hesap için ek doğrulama adımı gerekiyor. İlk sürümde desteklenmiyor.",
                409,
            )
        }

        const idToken = response.AuthenticationResult?.IdToken
        const accessToken = response.AuthenticationResult?.AccessToken

        if (!idToken || !accessToken) {
            throw new CognitoAuthError("UNKNOWN_AUTH_ERROR", "Cognito beklenen tokenları döndürmedi.", 500)
        }

        const profile = getCognitoProfileFromIdToken(idToken)

        return {
            id: profile.sub ?? email,
            email: profile.email ?? email,
            name: profile.name ?? profile.email ?? email,
            image: profile.picture,
            groups: profile.groups,
            idToken,
            accessToken,
            refreshToken: response.AuthenticationResult?.RefreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + (response.AuthenticationResult?.ExpiresIn ?? 3600),
        }
    } catch (error) {
        throw toCognitoAuthError(error)
    }
}
