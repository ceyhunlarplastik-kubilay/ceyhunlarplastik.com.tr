import { SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"

export async function signUpWithCognito(email: string, password: string) {
    try {
        const client = getCognitoClient()

        await client.send(new SignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            SecretHash: computeSecretHash(email),
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
            ],
        }))

        return { email }
    } catch (error) {
        throw toCognitoAuthError(error)
    }
}
