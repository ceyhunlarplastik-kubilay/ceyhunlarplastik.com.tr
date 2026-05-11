import { withAuth } from "next-auth/middleware"

type TokenLike = {
    error?: string
}

export const proxy = withAuth({
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

export default proxy

export const config = {
    matcher: [
        "/protected/:path*",
        "/admin/:path*",
        "/supplier/:path*",
        "/tedarikci/:path*",
        "/satinalma/:path*",
        "/satis/:path*",
        "/musteri/:path*",
    ]
}
