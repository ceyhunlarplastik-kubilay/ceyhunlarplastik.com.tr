import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { CognitoAuthError, getAuthErrorLogDetails, toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"
import { getAuthUserAccessStateByCognitoSub } from "@/features/auth/server/user-access"
import { getCognitoProfileFromIdToken } from "@/lib/auth/cognito-tokens"

export type SignInResult = {
    id: string
    dbUserId: string
    email: string
    firstName?: string | null
    lastName?: string | null
    name?: string
    image?: string
    identifier: string
    groups: string[]
    accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    customerId?: string | null
    supplierId?: string | null
    idToken: string
    accessToken: string
    refreshToken?: string
    expiresAt: number
}

export async function signInWithCognito(email: string, password: string): Promise<SignInResult> {
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

    let response
    try {
        response = await client.send(command)
    } catch (error) {
        console.error("Cognito sign-in failed", getAuthErrorLogDetails(error))
        throw toCognitoAuthError(error)
    }

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
    let accessState = null

    try {
        accessState = profile.sub
            ? await getAuthUserAccessStateByCognitoSub(profile.sub)
            : null
    } catch (error) {
        console.error("Auth user access lookup failed", getAuthErrorLogDetails(error))
        throw new CognitoAuthError("UNKNOWN_AUTH_ERROR", "Kullanıcı erişim kaydı doğrulanamadı.", 500)
    }

    if (!accessState) {
        throw new CognitoAuthError("UNKNOWN_AUTH_ERROR", "Kullanıcı erişim kaydı bulunamadı.", 404)
    }

    return {
        id: profile.sub ?? email,
        dbUserId: accessState.dbUserId,
        email: profile.email ?? email,
        firstName: accessState.firstName,
        lastName: accessState.lastName,
        name: accessState.displayName || profile.name || profile.email || email,
        image: accessState.imageUrl ?? profile.picture,
        identifier: accessState.identifier,
        groups: accessState.groups,
        accessStatus: accessState.accessStatus,
        customerId: accessState.customerId,
        supplierId: accessState.supplierId,
        idToken,
        accessToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + (response.AuthenticationResult?.ExpiresIn ?? 3600),
    }
}
