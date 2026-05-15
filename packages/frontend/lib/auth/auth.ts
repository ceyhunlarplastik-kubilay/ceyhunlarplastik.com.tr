import { getServerSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { refreshTokensWithCognito } from "@/features/auth/server/refresh-tokens"
import { signInWithCognito } from "@/features/auth/server/sign-in"
import { CognitoAuthError } from "@/features/auth/server/errors"
import { getAuthUserAccessStateByCognitoSub } from "@/features/auth/server/user-access"
import { getCognitoProfileFromIdToken } from "@/lib/auth/cognito-tokens"

type AuthenticatedUser = {
    id: string
    dbUserId: string
    email: string
    identifier: string
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
            }

            const expiresAt = token.expiresAt as number | undefined
            if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
                return token
            }

            const refreshToken = token.refreshToken as string | undefined
            if (!refreshToken) {
                return { ...token, error: "RefreshTokenError" }
            }

            try {
                const refreshed = await refreshTokensWithCognito(refreshToken)
                const profile = getCognitoProfileFromIdToken(refreshed.idToken)
                const accessState = profile.sub
                    ? await getAuthUserAccessStateByCognitoSub(profile.sub)
                    : null

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
                token.customerId = accessState?.customerId ?? token.customerId
                token.supplierId = accessState?.supplierId ?? token.supplierId
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

            if (session.user) {
                const accessState = typeof token.sub === "string"
                    ? await getAuthUserAccessStateByCognitoSub(token.sub)
                    : null

                session.user.id = typeof token.sub === "string" ? token.sub : undefined
                session.user.email = typeof token.email === "string" ? token.email : session.user.email
                session.user.name = typeof token.name === "string" ? token.name : session.user.name
                session.user.image = accessState?.imageUrl
                    ?? (typeof token.picture === "string" ? token.picture : session.user.image)
                session.user.dbUserId = typeof token.dbUserId === "string" ? token.dbUserId : accessState?.dbUserId
                session.user.identifier = typeof token.identifier === "string" ? token.identifier : accessState?.identifier
                session.user.groups = accessState?.groups ?? (Array.isArray(token.groups) ? token.groups : [])
                session.user.accessStatus = accessState?.accessStatus ?? token.accessStatus
                session.user.customerId = typeof accessState?.customerId === "string" || accessState?.customerId === null
                    ? accessState.customerId
                    : typeof token.customerId === "string" || token.customerId === null
                        ? token.customerId
                        : undefined
                session.user.supplierId = typeof accessState?.supplierId === "string" || accessState?.supplierId === null
                    ? accessState.supplierId
                    : typeof token.supplierId === "string" || token.supplierId === null
                        ? token.supplierId
                        : undefined
                session.user.isActive = accessState?.isActive
                    ?? (session.user.accessStatus === "ACTIVE")
            }

            if (session.user && !session.user.accessStatus) {
                session.user.accessStatus = "PENDING_REVIEW"
            }

            if (session.user && session.user.dbUserId === undefined && typeof token.dbUserId === "string") {
                session.user.dbUserId = token.dbUserId
            }

            if (session.user && session.user.identifier === undefined && typeof token.identifier === "string") {
                session.user.identifier = token.identifier
            }

            return session
        },
    },
}

export function auth() {
    return getServerSession(authOptions)
}
