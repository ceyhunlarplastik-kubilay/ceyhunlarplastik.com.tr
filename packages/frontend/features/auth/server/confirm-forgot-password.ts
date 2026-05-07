import { ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"

export async function confirmForgotPasswordWithCognito(email: string, code: string, password: string) {
    try {
        const client = getCognitoClient()

        await client.send(new ConfirmForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            SecretHash: computeSecretHash(email),
            Username: email,
            ConfirmationCode: code,
            Password: password,
        }))

        return { email }
    } catch (error) {
        throw toCognitoAuthError(error)
    }
}
