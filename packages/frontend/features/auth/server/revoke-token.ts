import { RevokeTokenCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"

export async function revokeRefreshToken(refreshToken: string) {
    const client = getCognitoClient()

    await client.send(new RevokeTokenCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        ClientSecret: process.env.COGNITO_CLIENT_SECRET!,
        Token: refreshToken,
    }))
}
