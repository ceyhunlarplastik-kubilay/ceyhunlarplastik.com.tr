import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCognitoClient } from "@/features/auth/server/cognito-client"
import { CognitoAuthError, getAuthErrorLogDetails, toCognitoAuthError } from "@/features/auth/server/errors"
import { computeSecretHash } from "@/features/auth/server/secret-hash"
import { fetchAuthUserAccessState } from "@/features/auth/server/user-access"
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

    return buildSignInResult(
        {
            idToken,
            accessToken,
            refreshToken: response.AuthenticationResult?.RefreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + (response.AuthenticationResult?.ExpiresIn ?? 3600),
        },
        email,
    )
}

export type CognitoTokenSet = {
    idToken: string
    accessToken: string
    refreshToken?: string
    /** Epoch saniyesi. */
    expiresAt: number
}

/**
 * Cognito token'ları elde edildikten SONRAKİ ortak adım: kimliği ve DB erişim durumunu okuyup
 * oturumun ihtiyaç duyduğu kullanıcıyı üretir. E-posta+şifre girişi de OAuth (Google) girişi de
 * buradan geçer — ikisi de aynı kapıyı aynı şekilde uygular (erişim durumu okunamazsa giriş yok).
 *
 * `fallbackEmail` yalnız ID token'da e-posta yoksa kullanılır (şifre girişinde kullanıcının
 * yazdığı adres); OAuth yolunda verilmez.
 */
export async function buildSignInResult(tokens: CognitoTokenSet, fallbackEmail?: string): Promise<SignInResult> {
    const { idToken, accessToken } = tokens
    const profile = getCognitoProfileFromIdToken(idToken)
    const email = profile.email || fallbackEmail

    if (!email) {
        throw new CognitoAuthError("UNKNOWN_AUTH_ERROR", "Kimlik jetonunda e-posta bulunamadı.", 500)
    }

    let accessState = null

    try {
        // Hata burada YUTULMAZ: girişte henüz hiçbir erişim durumu yok ve
        // sessizce boş yetkiyle devam etmek tehlikeli olurdu. Token yenileme
        // yolunda ise yutulur — orada elde bir önceki (geçerli) durum var.
        accessState = await fetchAuthUserAccessState(idToken)
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
        email,
        firstName: accessState.firstName,
        lastName: accessState.lastName,
        name: accessState.displayName || profile.name || email,
        image: accessState.imageUrl ?? profile.picture,
        identifier: accessState.identifier,
        groups: accessState.groups,
        accessStatus: accessState.accessStatus,
        customerId: accessState.customerId,
        supplierId: accessState.supplierId,
        idToken,
        accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
    }
}
