import { getServerSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { refreshTokensWithCognito } from "@/features/auth/server/refresh-tokens"
import { signInWithCognito } from "@/features/auth/server/sign-in"
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
 */
async function refreshAccessStateIfStale(token: Record<string, unknown>) {
    const checkedAt = typeof token.accessCheckedAt === "number" ? token.accessCheckedAt : 0
    if (Date.now() - checkedAt < ACCESS_STATE_MAX_AGE_MS) return token

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
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const typedUser = user as typeof user & AuthenticatedUser

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
                return refreshAccessStateIfStale(token)
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
