import { withAuth } from "next-auth/middleware"
import type { NextRequestWithAuth } from "next-auth/middleware"
import createIntlMiddleware from "next-intl/middleware"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { routing } from "./i18n/routing"

type TokenLike = {
    error?: string
}

/**
 * Bu proxy iki farklı middleware'i path'e göre ayrıştırır:
 * 1. Panel path'leri -> next-auth withAuth (mevcut davranış, DEĞİŞMEDİ)
 * 2. Public + auth path'leri -> next-intl (locale rewrite: / -> /tr içsel,
 *    /en/... -> [locale=en])
 *
 * Paneller [locale] ağacının DIŞINDA yaşar; intl middleware'e girerlerse
 * /tr/admin'e rewrite edilip 404 olurlar. Bu yüzden ayrım path prefix'iyle
 * yapılır ve iki liste app/(panels) içeriğiyle senkron tutulmak zorundadır.
 */

const intlProxy = createIntlMiddleware(routing)

// withAuth ile korunan panel path'leri — app/(panels)/ altındaki auth'lu bölümler.
const AUTH_PROTECTED_PREFIXES = [
    "/protected",
    "/admin",
    "/supplier",
    "/tedarikci",
    "/satinalma",
    "/satis",
    "/veri-girisi",
    "/musteri",
]

// [locale] dışında yaşayan ama withAuth matcher'ında da olmayan path'ler.
// hesabim kendi içinde auth() guard'ı taşır (page.tsx) — middleware koruması eklemek
// mevcut davranışı değiştirirdi.
const PLAIN_PASSTHROUGH_PREFIXES = ["/hesabim"]

const authProxy = withAuth({
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        authorized({ token, req }) {
            const { pathname } = req.nextUrl;
            const typedToken = (token ?? {}) as TokenLike

            // Token yoksa veya refresh hatası varsa → re-login
            if (!token) return false;

            // Refresh token geçersiz olduysa (Cognito'dan invalid_grant geldi)
            // false döndürmek NextAuth'un kullanıcıyı signin'e yönlendirmesini tetikler
            if (typedToken.error === "RefreshTokenError") return false;

            void pathname

            // Diğer protected route'lar için sadece login yeterli
            return true;
        }
    }
})

function startsWithPrefix(pathname: string, prefixes: string[]) {
    return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
    const { pathname } = req.nextUrl

    if (startsWithPrefix(pathname, AUTH_PROTECTED_PREFIXES)) {
        return authProxy(req as NextRequestWithAuth, event)
    }

    if (startsWithPrefix(pathname, PLAIN_PASSTHROUGH_PREFIXES)) {
        return NextResponse.next()
    }

    return intlProxy(req)
}

export const config = {
    // api, geocoding, Next içleri ve statik asset uzantıları hariç her şey.
    // Dikkat: ".*\\..*" gibi genel nokta dışlaması KULLANILMADI — ürün slug'ları
    // nokta içerebilir (varyant kodları "1.9" gibi); yalnızca bilinen asset
    // uzantıları dışlanır.
    matcher: [
        "/((?!api|geocoding|_next|_vercel|.*\\.(?:png|jpe?g|gif|svg|ico|webp|avif|css|js|mjs|map|txt|xml|json|webmanifest|pdf|mp4|webm|woff2?|ttf|otf|glb)$).*)",
    ],
}
