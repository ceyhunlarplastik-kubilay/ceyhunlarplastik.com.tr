import { getServerSession, NextAuthOptions } from "next-auth"
import type { OAuthConfig } from "next-auth/providers/oauth"
import CredentialsProvider from "next-auth/providers/credentials"
import { isGoogleLoginEnabled } from "@/features/auth/lib/google-login"
import { refreshTokensWithCognito } from "@/features/auth/server/refresh-tokens"
import { buildSignInResult, signInWithCognito } from "@/features/auth/server/sign-in"
import { CognitoAuthError } from "@/features/auth/server/errors"
import {
    ACCESS_STATE_MAX_AGE_MS,
    fetchAuthUserAccessState,
    type AuthUserAccessState,
} from "@/features/auth/server/user-access"
import { getCognitoProfileFromIdToken } from "@/lib/auth/cognito-tokens"

type AuthenticatedUser = {
    id: string
    dbUserId: string
    email: string
    identifier: string
    firstName?: string | null
    lastName?: string | null
    name?: string
    image?: string
    groups: string[]
    accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    customerId?: string | null
    supplierId?: string | null
    idToken: string
    accessToken: string
    refreshToken?: string
    expiresAt: number
}

type OAuthAccountLike = {
    provider?: string
    id_token?: string
    access_token?: string
    refresh_token?: string
    /** Epoch saniyesi (openid-client hesaplar). */
    expires_at?: number
}

/**
 * Giriş ANINDA oturumun kullanıcısını üretir (sonraki `jwt` çağrılarında ikisi de boştur).
 *
 * - E-posta+şifre: `authorize()` kullanıcıyı zaten tam üretti.
 * - OAuth (Google — Cognito Hosted UI): NextAuth yalnız profil + token'ları verir; erişim
 *   durumunu ve rolleri şifre girişiyle AYNI ortak adımdan (`buildSignInResult`) geçirerek
 *   biz üretiriz. Burada fırlatılan hata NextAuth'ta `?error=Callback` olarak görünür
 *   (`profile()` içinde fırlatılan hata ise sessizce /signin'e düşerdi).
 */
async function resolveSignedInUser(user: unknown, account: OAuthAccountLike | null | undefined): Promise<AuthenticatedUser | undefined> {
    if (account?.provider === "cognito") {
        if (!account.id_token || !account.access_token) {
            throw new Error("OAUTH_TOKENS_MISSING")
        }

        return buildSignInResult({
            idToken: account.id_token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
        })
    }

    return user ? (user as AuthenticatedUser) : undefined
}

/** `tokens.claims()`in ham çıktısı — `next-auth`'un dar `Profile` tipi `sub/name/email/image`
 *  ile sınırlı, Cognito'nun ID token'ı ise ham JWT claim'lerini taşıyor (`picture` dahil). */
type CognitoIdTokenClaims = {
    sub?: string
    name?: string
    email?: string
    picture?: string
}

/**
 * Google ile giriş: Cognito Hosted UI üzerinden OAuth. `identity_provider=Google` giriş
 * sayfasını atlar ve kullanıcıyı doğrudan Google hesap seçiciye götürür. Bayrak kapalıyken
 * sağlayıcı HİÇ kaydedilmez (Cognito'da da Google yoktur, bkz. infra/cognito.ts).
 *
 * `next-auth/providers/cognito` fabrikası KULLANILMIYOR: o daima `wellKnown` verir
 * (`${issuer}/.well-known/openid-configuration`), ve NextAuth v4 bunu HİÇ önbelleğe
 * almıyor (`core/lib/oauth/client.js` → her çağrıda `Issuer.discover()`). Google girişinin
 * HER adımında (`/api/auth/signin/cognito` VE `/api/auth/callback/cognito`) ayrı ayrı
 * çalıştığı için tek girişte 2 gereksiz AWS ağ turu ekliyordu — kubi'de ölçüldü: Google
 * girişi 7-8 sn, e-posta+şifre 2-3 sn (aynı `/me/auth-state` çağrısını paylaşıyorlar, fark
 * yalnız bu). Cognito'nun OAuth uç noktaları `COGNITO_DOMAIN`/`COGNITO_ISSUER`'dan sabit ve
 * öngörülebilir biçimde türediği için (AWS dokümantasyonu), doğrudan verilip discovery
 * tamamen atlanabiliyor — bu, next-auth v4 + Cognito için bilinen bir hızlandırma deseni.
 */
function buildGoogleLoginProviders(): OAuthConfig<CognitoIdTokenClaims>[] {
    if (!isGoogleLoginEnabled()) return []

    const cognitoDomain = `https://${process.env.COGNITO_DOMAIN}`
    const issuer = process.env.COGNITO_ISSUER!

    const cognitoOAuthProvider: OAuthConfig<CognitoIdTokenClaims> = {
        id: "cognito",
        name: "Cognito",
        type: "oauth",
        issuer,
        clientId: process.env.COGNITO_CLIENT_ID!,
        clientSecret: process.env.COGNITO_CLIENT_SECRET!,
        authorization: {
            url: `${cognitoDomain}/oauth2/authorize`,
            params: { identity_provider: "Google", scope: "openid email profile" },
        },
        token: { url: `${cognitoDomain}/oauth2/token` },
        // Hiç çağrılmıyor (aşağıdaki `idToken: true` yüzünden — ID token claim'leri
        // yeterli) ama tip/dokümantasyon bütünlüğü için tanımlı tutuluyor.
        userinfo: { url: `${cognitoDomain}/oauth2/userInfo` },
        jwks_endpoint: `${issuer}/.well-known/jwks.json`,
        idToken: true,
        // NextAuth v4 varsayılanı yalnız ["state"]. Cognito, federe (Google) girişte ID
        // token'a KENDİ ürettiği bir `nonce` koyuyor; NextAuth nonce göndermediyse
        // openid-client "nonce mismatch, expected undefined" ile girişi düşürür (bilinen
        // NextAuth+Cognito sorunu, kubi'de yaşandı). Kendi nonce'umuzu gönderince Cognito onu
        // ID token'a yansıtır (AWS: authorize `nonce` parametresi) ve doğrulama tutar.
        checks: ["state", "nonce"],
        profile(profile) {
            return {
                id: profile.sub ?? "",
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }
        },
    }

    return [cognitoOAuthProvider]
}

/**
 * Erişim durumunu okur; hata YUTULUR.
 *
 * Bu çağrı auth akışının içinde: API geçici olarak erişilemezse kullanıcının
 * oturumunu düşürmek yanlış olur — elindeki (bir önceki) durum korunur ve bir
 * sonraki denemede tazelenir. Giriş yolunda ise hata YUTULMAZ (bkz. sign-in.ts):
 * orada hiç durum yoktur ve sessizce boş yetkiyle devam etmek tehlikelidir.
 */
async function readAccessState(idToken?: unknown): Promise<AuthUserAccessState | null> {
    if (typeof idToken !== "string" || !idToken) return null

    try {
        return await fetchAuthUserAccessState(idToken)
    } catch (error) {
        console.error("Access state refresh failed:", error)
        return null
    }
}

/**
 * Cognito token'ı hâlâ geçerliyken erişim durumunu tazeler — ama yalnız
 * eskiyse. Token ömrü (1 saat) ile erişim tazeliği AYRI eksenlerdir: kullanıcı
 * askıya alındığında bir saat beklemek istemiyoruz.
 *
 * `force`: `/hesabim`'in "Uygun panele git" butonu `useMyAccess()` ile CANLI durumu
 * gösteriyor (5 sn'de bir `/me/access`), ama tıklanınca gidilen panelin `layout.tsx`'i
 * BU token'a bakıyor — onay bu 5 dakikalık pencerede gelmişse token hâlâ eski
 * `accessStatus`/`groups`'u taşır ve panel kullanıcıyı `/hesabim`'e geri yollar (bir
 * hataya benzemez, sadece "gitmiyor" gibi görünür). `force` bu eşiği atlar;
 * `AccountStatusPageClient` erişim ACTIVE olur olmaz `update()` ile burayı tetikler.
 */
async function refreshAccessStateIfStale(token: Record<string, unknown>, force = false) {
    const checkedAt = typeof token.accessCheckedAt === "number" ? token.accessCheckedAt : 0
    if (!force && Date.now() - checkedAt < ACCESS_STATE_MAX_AGE_MS) return token

    const accessState = await readAccessState(token.idToken)
    if (!accessState) return token

    token.groups = accessState.groups
    token.accessStatus = accessState.accessStatus
    token.dbUserId = accessState.dbUserId
    token.identifier = accessState.identifier
    token.firstName = accessState.firstName
    token.lastName = accessState.lastName
    token.name = accessState.displayName
    token.picture = accessState.imageUrl ?? token.picture
    token.customerId = accessState.customerId
    token.supplierId = accessState.supplierId
    token.isActive = accessState.isActive
    token.accessCheckedAt = Date.now()

    return token
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            id: "cognito-credentials",
            name: "Cognito Credentials",
            credentials: {
                email: { label: "E-posta", type: "email" },
                password: { label: "Şifre", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim().toLowerCase()
                const password = credentials?.password

                if (!email || !password) {
                    throw new Error("INVALID_CREDENTIALS")
                }

                try {
                    return await signInWithCognito(email, password)
                } catch (error) {
                    if (error instanceof CognitoAuthError) {
                        throw new Error(error.code)
                    }

                    throw error
                }
            },
        }),
        ...buildGoogleLoginProviders(),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user, account, trigger }) {
            const typedUser = await resolveSignedInUser(user, account)

            if (typedUser) {
                token.sub = typedUser.id
                token.dbUserId = typedUser.dbUserId
                token.email = typedUser.email
                token.identifier = typedUser.identifier
                token.firstName = typedUser.firstName
                token.lastName = typedUser.lastName
                token.name = typedUser.name
                token.picture = typedUser.image
                token.groups = typedUser.groups
                token.accessStatus = typedUser.accessStatus
                token.customerId = typedUser.customerId
                token.supplierId = typedUser.supplierId
                token.idToken = typedUser.idToken
                token.accessToken = typedUser.accessToken
                token.refreshToken = typedUser.refreshToken
                token.expiresAt = typedUser.expiresAt
                token.error = undefined
                // Giriş anında erişim durumu taze geldi (bkz. sign-in.ts).
                token.accessCheckedAt = Date.now()
            }

            const expiresAt = token.expiresAt as number | undefined
            if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
                // Cognito token'ı hâlâ geçerli. Erişim durumu ayrı bir eksende
                // bayatlar: kullanıcı askıya alınmış olabilir. Token ömrüne
                // (1 saat) bağlı kalmamak için kendi eşiğiyle tazelenir.
                return refreshAccessStateIfStale(token, trigger === "update")
            }

            const refreshToken = token.refreshToken as string | undefined
            if (!refreshToken) {
                return { ...token, error: "RefreshTokenError" }
            }

            try {
                const refreshed = await refreshTokensWithCognito(refreshToken)
                const profile = getCognitoProfileFromIdToken(refreshed.idToken)
                // Yeni token elde; erişim durumu da bu tazelikte okunur.
                const accessState = await readAccessState(refreshed.idToken)

                token.idToken = refreshed.idToken
                token.accessToken = refreshed.accessToken
                token.refreshToken = refreshed.refreshToken
                token.expiresAt = refreshed.expiresAt
                token.groups = accessState?.groups ?? token.groups
                token.accessStatus = accessState?.accessStatus ?? token.accessStatus
                token.email = profile.email ?? token.email
                token.name = profile.name ?? token.name
                token.picture = accessState?.imageUrl ?? profile.picture ?? token.picture
                token.sub = profile.sub ?? token.sub
                token.dbUserId = accessState?.dbUserId ?? token.dbUserId
                token.identifier = accessState?.identifier ?? token.identifier
                token.firstName = accessState?.firstName ?? token.firstName
                token.lastName = accessState?.lastName ?? token.lastName
                token.name = accessState?.displayName ?? profile.name ?? token.name
                token.customerId = accessState?.customerId ?? token.customerId
                token.supplierId = accessState?.supplierId ?? token.supplierId
                token.isActive = accessState?.isActive ?? token.isActive
                if (accessState) token.accessCheckedAt = Date.now()
                token.error = undefined
            } catch (error) {
                console.error("Token refresh failed:", error)
                token.error = "RefreshTokenError"
            }

            return token
        },

        async session({ session, token }) {
            session.idToken = token.idToken
            session.accessToken = token.accessToken
            session.error = token.error

            // SIFIR I/O: erişim durumu `jwt` callback'inde token'a yazıldı.
            // Eskiden burada her session okumasında bir DB sorgusu vardı — yani
            // her panel sayfası render'ında ve her `/api/auth/session` isteğinde.
            if (session.user) {
                session.user.id = typeof token.sub === "string" ? token.sub : undefined
                session.user.email = typeof token.email === "string" ? token.email : session.user.email
                session.user.name = typeof token.name === "string" ? token.name : session.user.name
                session.user.image = typeof token.picture === "string" ? token.picture : session.user.image
                session.user.dbUserId = typeof token.dbUserId === "string" ? token.dbUserId : undefined
                session.user.identifier = typeof token.identifier === "string" ? token.identifier : undefined
                session.user.firstName = typeof token.firstName === "string" || token.firstName === null
                    ? token.firstName
                    : undefined
                session.user.lastName = typeof token.lastName === "string" || token.lastName === null
                    ? token.lastName
                    : undefined
                session.user.groups = Array.isArray(token.groups) ? token.groups : []
                session.user.accessStatus = token.accessStatus
                session.user.customerId = typeof token.customerId === "string" || token.customerId === null
                    ? token.customerId
                    : undefined
                session.user.supplierId = typeof token.supplierId === "string" || token.supplierId === null
                    ? token.supplierId
                    : undefined
                session.user.isActive = typeof token.isActive === "boolean"
                    ? token.isActive
                    : session.user.accessStatus === "ACTIVE"
            }

            // Erişim durumu hiç yazılamadıysa EN DAR yetkiye düş: panel kapıları
            // `!== "ACTIVE"` kontrolü yapıyor, yani belirsizlik erişim vermemeli.
            if (session.user && !session.user.accessStatus) {
                session.user.accessStatus = "PENDING_REVIEW"
            }

            return session
        },
    },
}

export function auth() {
    return getServerSession(authOptions)
}
