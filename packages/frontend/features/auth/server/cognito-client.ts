import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider"

let cognitoClient: CognitoIdentityProviderClient | null = null

export function getCognitoClient() {
    if (!cognitoClient) {
        cognitoClient = new CognitoIdentityProviderClient({
            region: process.env.REGION ?? process.env.AWS_REGION ?? "eu-west-1",
        })
    }

    return cognitoClient
}
