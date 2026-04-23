import { getServerSession, NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

const KNOWN_GROUPS = ["owner", "admin", "supplier", "user"] as const

function normalizeGroups(groups: string[]): string[] {
    const cleaned = groups
        .map((group) => group.trim().toLowerCase())
        .filter(Boolean)

    if (cleaned.length === 1) {
        const merged = cleaned[0]
        const extracted = KNOWN_GROUPS.filter((group) => merged.includes(group))
        if (extracted.length > 1) return extracted
    }

    return Array.from(new Set(cleaned))
}

function parseCognitoGroups(rawGroups: unknown): string[] {
    if (Array.isArray(rawGroups)) {
        return normalizeGroups(rawGroups
            .filter((group): group is string => typeof group === "string")
            .map((group) => group.trim().toLowerCase())
            .filter(Boolean))
    }

    if (typeof rawGroups !== "string") return []

    const normalized = rawGroups
        .replace(/]\s*\[/g, ",")
        .replace(/[\[\]"]/g, "")
        .trim()

    if (!normalized) return []

    return normalizeGroups(normalized
        .split(/[,\s]+/)
        .map((group) => group.trim().toLowerCase())
        .filter(Boolean))
}

function parseGroupsFromIdToken(idToken: unknown): string[] {
    if (typeof idToken !== "string" || !idToken) return []

    try {
        const parts = idToken.split(".")
        if (parts.length < 2) return []

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
        const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as Record<string, unknown>

        return parseCognitoGroups(payload["cognito:groups"])
    } catch {
        return []
    }
}

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

                const fromAccountToken = parseGroupsFromIdToken(account.id_token)
                if (fromAccountToken.length > 0) {
                    token.groups = fromAccountToken
                }
            }

            // ✅ groups: sadece profile geldiğinde güncelle, yoksa mevcut token'daki groups'u koru
            if (profile) {
                const rawGroups =
                    typeof profile === "object"
                        ? (profile as any)["cognito:groups"]
                        : undefined;

                const parsed = parseCognitoGroups(rawGroups)
                if (parsed.length > 0) {
                    token.groups = parsed
                }
            }

            if (!Array.isArray(token.groups) || token.groups.length === 0) {
                const fromToken = parseGroupsFromIdToken(token.idToken)
                if (fromToken.length > 0) {
                    token.groups = fromToken
                }
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
                const fromRefreshedToken = parseGroupsFromIdToken(refreshed.idToken)
                if (fromRefreshedToken.length > 0) {
                    token.groups = fromRefreshedToken
                }
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
                (session.user as any).groups = Array.isArray(token.groups) ? token.groups : [];
                // name & image NextAuth'un CognitoProvider'ından gelir; token'da tutulur
                if (!session.user.name && token.name) {
                    session.user.name = token.name as string;
                }
                if (!session.user.image && token.picture) {
                    session.user.image = token.picture as string;
                }
            }

            return session;
        }
    }
};

export function auth() {
    return getServerSession(authOptions);
}
