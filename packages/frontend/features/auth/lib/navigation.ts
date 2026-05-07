export function resolveAuthHome(groups: string[] = []) {
    if (groups.includes("owner") || groups.includes("admin")) return "/admin"
    if (groups.includes("purchasing")) return "/satinalma"
    if (groups.includes("sales")) return "/satis"
    if (groups.includes("supplier")) return "/tedarikci"
    return "/"
}

export function getCallbackPathname(callbackUrl?: string) {
    if (!callbackUrl) return "/"

    try {
        const url = callbackUrl.startsWith("http")
            ? new URL(callbackUrl)
            : new URL(callbackUrl, "http://localhost:3000")

        return url.pathname
    } catch {
        return "/"
    }
}

export function canAccessPath(groups: string[] = [], pathname: string) {
    if (pathname.startsWith("/admin")) {
        return groups.includes("admin") || groups.includes("owner")
    }

    if (pathname.startsWith("/tedarikci") || pathname.startsWith("/supplier")) {
        return groups.includes("supplier") || groups.includes("admin") || groups.includes("owner")
    }

    if (pathname.startsWith("/satinalma")) {
        return groups.includes("purchasing") || groups.includes("admin") || groups.includes("owner")
    }

    if (pathname.startsWith("/satis")) {
        return groups.includes("sales") || groups.includes("admin") || groups.includes("owner")
    }

    return true
}
