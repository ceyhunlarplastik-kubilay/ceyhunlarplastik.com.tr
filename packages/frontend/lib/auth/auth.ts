import { getServerSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { refreshTokensWithCognito } from "@/features/auth/server/refresh-tokens"
import { signInWithCognito } from "@/features/auth/server/sign-in"
import { CognitoAuthError } from "@/features/auth/server/errors"
import { getCognitoProfileFromIdToken } from "@/lib/auth/cognito-tokens"

type AuthenticatedUser = {
    id: string
    email: string
    name?: string
    image?: string
    groups: string[]
    customerId?: string | null
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
                token.email = typedUser.email
                token.name = typedUser.name
                token.picture = typedUser.image
                token.groups = typedUser.groups
                token.customerId = typedUser.customerId
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

                token.idToken = refreshed.idToken
                token.accessToken = refreshed.accessToken
                token.refreshToken = refreshed.refreshToken
                token.expiresAt = refreshed.expiresAt
                token.groups = profile.groups.length > 0 ? profile.groups : token.groups
                token.email = profile.email ?? token.email
                token.name = profile.name ?? token.name
                token.picture = profile.picture ?? token.picture
                token.sub = profile.sub ?? token.sub
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
                session.user.id = typeof token.sub === "string" ? token.sub : undefined
                session.user.email = typeof token.email === "string" ? token.email : session.user.email
                session.user.name = typeof token.name === "string" ? token.name : session.user.name
                session.user.image = typeof token.picture === "string" ? token.picture : session.user.image
                session.user.groups = Array.isArray(token.groups) ? token.groups : []
                session.user.customerId = typeof token.customerId === "string" || token.customerId === null
                    ? token.customerId
                    : undefined
            }

            return session
        },
    },
}

export function auth() {
    return getServerSession(authOptions)
}
