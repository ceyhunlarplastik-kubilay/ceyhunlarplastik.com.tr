import NextAuth, { NextAuthOptions } from "next-auth"
import CognitoProvider from "next-auth/providers/cognito";

export const authOptions: NextAuthOptions = {
    providers: [
        CognitoProvider({
            clientId: process.env.COGNITO_CLIENT_ID!,
            clientSecret: process.env.COGNITO_CLIENT_SECRET!,
            issuer: process.env.COGNITO_ISSUER!,
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, profile }) {
            // Cognito groups run as "cognito:groups" in the ID token
            if (profile && "cognito:groups" in profile) {
                token.groups = profile["cognito:groups"];
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // Attach the user's groups to the session
                (session.user as { groups?: string[] }).groups = (token.groups as string[]) || [];
            }
            return session;
        }
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }