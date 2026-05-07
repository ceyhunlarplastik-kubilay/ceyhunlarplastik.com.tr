import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { revokeRefreshToken } from "@/features/auth/server/revoke-token"
import { ok } from "@/features/auth/server/http"

export const runtime = "nodejs"

type TokenWithRefresh = {
    refreshToken?: unknown
}

export async function POST(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    }) as TokenWithRefresh | null

    const refreshToken = typeof token?.refreshToken === "string" ? token.refreshToken : null

    if (refreshToken) {
        try {
            await revokeRefreshToken(refreshToken)
        } catch (error) {
            console.error("Failed to revoke refresh token", error)
        }
    }

    return ok({
        revoked: Boolean(refreshToken),
    })
}
