import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider"
// import { NodeHttpHandler } from "@smithy/node-http-handler"

let cognitoClient: CognitoIdentityProviderClient | null = null

export function getCognitoClient() {
    if (!cognitoClient) {
        cognitoClient = new CognitoIdentityProviderClient({
            // region: process.env.REGION ?? process.env.AWS_REGION ?? "eu-west-1",
            region: process.env.REGION ?? process.env.AWS_REGION,
            /*             requestHandler: new NodeHttpHandler({
                            connectionTimeout: 3_000,
                            requestTimeout: 8_000,
                        }), */
        })
    }

    return cognitoClient
}
