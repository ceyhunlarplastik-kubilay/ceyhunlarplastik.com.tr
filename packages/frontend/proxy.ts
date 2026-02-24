import { withAuth } from "next-auth/middleware"

export const proxy = withAuth({
    callbacks: {
        authorized({ token, req }) {
            const { pathname } = req.nextUrl;

            // Login değilse hiçbir protected alana giremesin
            if (!token) return false;

            // /admin ile başlıyorsa role kontrolü yap
            if (pathname.startsWith("/admin")) {
                const groups = token.groups as string[] | undefined;

                if (!groups) return false;

                return groups.includes("admin") || groups.includes("owner");
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
        "/admin/:path*"
    ]
}

/* import { withAuth } from "next-auth/middleware"

// Next.js 16+ conventions use `proxy` either as default export or named `proxy` export.
export const proxy = withAuth({
    callbacks: {
        authorized({ req, token }) {
            // "token" varsa kullanıcı aktiftir
            return !!token;
        }
    }
})

export default proxy;

export const config = {
    // Tüm /protected ile başlayan endpoint ve route sayfalarını koruma altına al
    matcher: ["/protected/:path*"]
}
 */