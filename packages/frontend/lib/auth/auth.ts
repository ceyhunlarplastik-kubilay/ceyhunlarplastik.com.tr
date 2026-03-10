import { getServerSession, NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

/**
 * Cognito token endpoint üzerinden refresh token ile yeni tokenlar alır.
 */
async function refreshCognitoToken(refreshToken: string) {
    const domain = process.env.COGNITO_DOMAIN!;
    const clientId = process.env.COGNITO_CLIENT_ID!;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`https://${domain}/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: clientId,
            refresh_token: refreshToken,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Token refresh failed:", data);
        throw new Error("RefreshTokenError");
    }

    return {
        idToken: data.id_token as string,
        accessToken: data.access_token as string,
        expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in as number),
        // Cognito refresh token'ı rotate etmez, aynı kalır
    };
}

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
            // ✅ İlk login: tüm tokenları kaydet
            if (account) {
                token.idToken = account.id_token;
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at; // epoch seconds
            }

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

            // ✅ Token henüz expire olmadıysa olduğu gibi dön
            const expiresAt = token.expiresAt as number | undefined;
            if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
                return token;
            }

            // ✅ Token expire olduysa refresh et
            const refreshToken = token.refreshToken as string | undefined;
            if (!refreshToken) {
                console.error("No refresh token available, forcing re-login");
                return { ...token, error: "RefreshTokenError" };
            }

            try {
                const refreshed = await refreshCognitoToken(refreshToken);
                token.idToken = refreshed.idToken;
                token.accessToken = refreshed.accessToken;
                token.expiresAt = refreshed.expiresAt;
                token.error = undefined;
            } catch (err) {
                console.error("Token refresh failed:", err);
                token.error = "RefreshTokenError";
            }

            return token;
        },

        async session({ session, token }) {
            (session as any).idToken = token.idToken;
            (session as any).accessToken = token.accessToken;
            (session as any).error = token.error;

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