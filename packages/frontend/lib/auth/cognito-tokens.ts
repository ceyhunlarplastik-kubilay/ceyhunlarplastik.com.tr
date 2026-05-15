const KNOWN_GROUPS = ["owner", "admin", "purchasing", "sales", "sales_director", "supplier", "customer", "user"] as const

export type CognitoIdTokenProfile = {
    sub?: string
    email?: string
    name?: string
    picture?: string
    groups: string[]
}

export function normalizeGroups(groups: string[]): string[] {
    const cleaned = groups
        .map((group) => group.trim().toLowerCase())
        .filter(Boolean)

    return Array.from(new Set(cleaned))
}

export function parseCognitoGroups(rawGroups: unknown): string[] {
    if (Array.isArray(rawGroups)) {
        return normalizeGroups(rawGroups
            .filter((group): group is string => typeof group === "string")
            .flatMap((group) => group.replace(/[\[\]"]/g, "").split(/[,\s]+/))
            .map((group) => group.trim().toLowerCase())
            .filter((group) => KNOWN_GROUPS.includes(group as typeof KNOWN_GROUPS[number])))
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
        .filter((group) => KNOWN_GROUPS.includes(group as typeof KNOWN_GROUPS[number])))
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".")
        if (parts.length < 2) return null

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
        const decoded = typeof atob === "function"
            ? atob(padded)
            : Buffer.from(padded, "base64").toString("utf-8")

        return JSON.parse(decoded) as Record<string, unknown>
    } catch {
        return null
    }
}

export function getCognitoProfileFromIdToken(idToken: unknown): CognitoIdTokenProfile {
    if (typeof idToken !== "string" || !idToken) {
        return { groups: [] }
    }

    const payload = decodeJwtPayload(idToken)
    if (!payload) {
        return { groups: [] }
    }

    return {
        sub: typeof payload.sub === "string" ? payload.sub : undefined,
        email: typeof payload.email === "string" ? payload.email : undefined,
        name: typeof payload.name === "string" ? payload.name : undefined,
        picture: typeof payload.picture === "string" ? payload.picture : undefined,
        groups: parseCognitoGroups(payload["cognito:groups"]),
    }
}
