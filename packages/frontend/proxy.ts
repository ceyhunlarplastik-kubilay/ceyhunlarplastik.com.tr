import { withAuth } from "next-auth/middleware"

export const proxy = withAuth({
    callbacks: {
        authorized({ token, req }) {
            const { pathname } = req.nextUrl;

            // Token yoksa veya refresh hatası varsa → re-login
            if (!token) return false;

            // Refresh token geçersiz olduysa (Cognito'dan invalid_grant geldi)
            // false döndürmek NextAuth'un kullanıcıyı signin'e yönlendirmesini tetikler
            if ((token as any).error === "RefreshTokenError") return false;

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
