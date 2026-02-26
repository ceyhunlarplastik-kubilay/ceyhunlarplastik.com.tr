import { getServerSession, NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

export const authOptions: NextAuthOptions = {
    providers: [
        CognitoProvider({
            clientId: process.env.COGNITO_CLIENT_ID!,
            clientSecret: process.env.COGNITO_CLIENT_SECRET!,
            issuer: process.env.COGNITO_ISSUER!,
            authorization: {
                params: {
                    scope: "email openid phone profile",
                },
            },
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, profile, account }) {
            if (account?.id_token) token.idToken = account.id_token;
            if (account?.access_token) token.accessToken = account.access_token;

            // ✅ groups: sadece profile geldiğinde güncelle, yoksa mevcut token'daki groups'u koru
            if (profile) {
                const rawGroups =
                    typeof profile === "object"
                        ? (profile as any)["cognito:groups"]
                        : undefined;

                token.groups = Array.isArray(rawGroups)
                    ? rawGroups.filter((x): x is string => typeof x === "string")
                    : [];
            }
            // profile yoksa token.groups olduğu gibi kalır (bir önceki değer)

            return token;
        },

        async session({ session, token }) {
            (session as any).idToken = token.idToken;
            (session as any).accessToken = token.accessToken;

            if (session.user) {
                (session.user as any).groups = token.groups || [];
            }

            return session;
        }
    }
};

export function auth() {
    return getServerSession(authOptions);
}