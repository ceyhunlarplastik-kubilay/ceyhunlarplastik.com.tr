import { SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"

export async function signUpWithCognito(email: string, password: string, firstName: string, lastName: string) {
    const normalizedFirstName = firstName.trim()
    const normalizedLastName = lastName.trim()
    const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim()

    try {
        const client = getCognitoClient()

        await client.send(new SignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            SecretHash: computeSecretHash(email),
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "given_name", Value: normalizedFirstName },
                { Name: "family_name", Value: normalizedLastName },
                { Name: "name", Value: fullName },
            ],
        }))

        return { email }
    } catch (error) {
        throw toCognitoAuthError(error)
    }
}
