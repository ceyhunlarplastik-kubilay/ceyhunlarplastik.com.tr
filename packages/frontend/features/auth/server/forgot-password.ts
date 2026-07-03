import { ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { getAuthErrorLogDetails, toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"

export async function forgotPasswordWithCognito(email: string) {
    try {
        const client = getCognitoClient()

        await client.send(new ForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            SecretHash: computeSecretHash(email),
            Username: email,
        }))

        return { email }
    } catch (error) {
        console.error("Cognito forgot-password failed", getAuthErrorLogDetails(error))
        throw toCognitoAuthError(error)
    }
}
