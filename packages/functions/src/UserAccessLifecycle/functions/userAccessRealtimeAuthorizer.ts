import { userRepository } from "@/core/helpers/prisma/users/repository"
import { CognitoJwtVerifier } from "aws-jwt-verify"
import { realtime } from "sst/aws/realtime"
import { realtimeSessionSeconds, realtimeSubscriptions } from "./realtimeAccess"

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null

function emptyAuthResult() {
    return { subscribe: [], publish: [] }
}

function getVerifier() {
    if (verifier) return verifier

    const userPoolId = process.env.COGNITO_USER_POOL_ID
    const clientId = process.env.COGNITO_CLIENT_ID
    if (!userPoolId || !clientId) return null

    verifier = CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: "id",
        clientId,
    })

    return verifier
}

export const handler = realtime.authorizer(async (token) => {
    if (!token) {
        return emptyAuthResult()
    }

    const tokenVerifier = getVerifier()
    if (!tokenVerifier) {
        return emptyAuthResult()
    }

    try {
        const payload = await tokenVerifier.verify(token)
        const sub = typeof payload.sub === "string" ? payload.sub : null

        if (!sub) {
            return emptyAuthResult()
        }

        const user = await userRepository().getUserByCognitoSub(sub)
        if (!user || !user.isActive) {
            return emptyAuthResult()
        }

        // Konu kuralları (kendi erişim / bildirim konuları + rolüne göre üretim konusu) `realtimeAccess.ts`'te.
        // Tarayıcı hiçbir konuya yayın yapamaz. Bağlantı jetonun süresi dolunca kesilir; istemci yeni
        // jetonla yeniden bağlanır.
        return {
            subscribe: realtimeSubscriptions({ sub, user, env: process.env }),
            publish: [],
            disconnectAfterInSeconds: realtimeSessionSeconds(payload.exp, Math.floor(Date.now() / 1000)),
        }
    } catch (error) {
        console.error("Realtime authorizer rejected token", error)
        return emptyAuthResult()
    }
})
