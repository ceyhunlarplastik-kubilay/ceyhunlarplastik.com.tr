import { withAuth } from "next-auth/middleware"

const KNOWN_GROUPS = ["owner", "admin", "purchasing", "sales", "supplier", "user"] as const

function normalizeGroups(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        const arr = raw
            .filter((x): x is string => typeof x === "string")
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean)
        if (arr.length === 1) {
            const extracted = KNOWN_GROUPS.filter((g) => arr[0].includes(g))
            if (extracted.length > 1) return extracted
        }
        return arr
    }

    if (typeof raw !== "string") return []

    const normalized = raw
        .replace(/]\s*\[/g, ",")
        .replace(/[\[\]"]/g, "")
        .trim()
    if (!normalized) return []

    const arr = normalized
        .split(/[,\s]+/)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)

    if (arr.length === 1) {
        const extracted = KNOWN_GROUPS.filter((g) => arr[0].includes(g))
        if (extracted.length > 1) return extracted
    }

    return arr
}

function parseGroupsFromIdToken(idToken: unknown): string[] {
    if (typeof idToken !== "string" || !idToken) return []

    try {
        const parts = idToken.split(".")
        if (parts.length < 2) return []

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
        const decoded = atob(padded)
        const payload = JSON.parse(decoded) as Record<string, unknown>

        return normalizeGroups(payload["cognito:groups"])
    } catch {
        return []
    }
}

type TokenLike = {
    error?: string
    groups?: unknown
    idToken?: unknown
}

export const proxy = withAuth({
    callbacks: {
        authorized({ token, req }) {
            const { pathname } = req.nextUrl;
            const typedToken = (token ?? {}) as TokenLike

            // Token yoksa veya refresh hatası varsa → re-login
            if (!token) return false;

            // Refresh token geçersiz olduysa (Cognito'dan invalid_grant geldi)
            // false döndürmek NextAuth'un kullanıcıyı signin'e yönlendirmesini tetikler
            if (typedToken.error === "RefreshTokenError") return false;

            // /admin ile başlıyorsa role kontrolü yap
            if (pathname.startsWith("/admin")) {
                const groups = normalizeGroups(typedToken.groups);
                const fallbackGroups =
                    groups.length > 0 ? groups : parseGroupsFromIdToken(typedToken.idToken);

                if (fallbackGroups.length === 0) return false;

                return fallbackGroups.includes("admin") || fallbackGroups.includes("owner");
            }

            if (pathname.startsWith("/supplier") || pathname.startsWith("/tedarikci")) {
                const groups = normalizeGroups(typedToken.groups);
                const fallbackGroups =
                    groups.length > 0 ? groups : parseGroupsFromIdToken(typedToken.idToken);
                if (fallbackGroups.length === 0) return false;

                return (
                    fallbackGroups.includes("supplier") ||
                    fallbackGroups.includes("admin") ||
                    fallbackGroups.includes("owner")
                );
            }

            if (pathname.startsWith("/satinalma")) {
                const groups = normalizeGroups(typedToken.groups);
                const fallbackGroups =
                    groups.length > 0 ? groups : parseGroupsFromIdToken(typedToken.idToken);
                if (fallbackGroups.length === 0) return false;

                return (
                    fallbackGroups.includes("purchasing") ||
                    fallbackGroups.includes("admin") ||
                    fallbackGroups.includes("owner")
                );
            }

            if (pathname.startsWith("/satis")) {
                const groups = normalizeGroups(typedToken.groups);
                const fallbackGroups =
                    groups.length > 0 ? groups : parseGroupsFromIdToken(typedToken.idToken);
                if (fallbackGroups.length === 0) return false;

                return (
                    fallbackGroups.includes("sales") ||
                    fallbackGroups.includes("admin") ||
                    fallbackGroups.includes("owner")
                );
            }

            // Diğer protected route'lar için sadece login yeterli
            return true;
        }
    }
})

export default proxy

export const config = {
    matcher: [
        "/protected/:path*",
        "/admin/:path*",
        "/supplier/:path*",
        "/tedarikci/:path*",
        "/satinalma/:path*",
        "/satis/:path*",
    ]
}
