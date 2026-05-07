import { GetTokensFromRefreshTokenCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { CognitoAuthError, toCognitoAuthError } from "@/features/auth/server/errors"

export async function refreshTokensWithCognito(refreshToken: string) {
    try {
        const client = getCognitoClient()

        const response = await client.send(new GetTokensFromRefreshTokenCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            ClientSecret: process.env.COGNITO_CLIENT_SECRET!,
            RefreshToken: refreshToken,
        }))

        const idToken = response.AuthenticationResult?.IdToken
        const accessToken = response.AuthenticationResult?.AccessToken

        if (!idToken || !accessToken) {
            throw new CognitoAuthError("UNKNOWN_AUTH_ERROR", "Token yenileme beklenen sonucu üretmedi.", 500)
        }

        return {
            idToken,
            accessToken,
            refreshToken: response.AuthenticationResult?.RefreshToken ?? refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + (response.AuthenticationResult?.ExpiresIn ?? 3600),
        }
    } catch (error) {
        throw toCognitoAuthError(error)
    }
}
