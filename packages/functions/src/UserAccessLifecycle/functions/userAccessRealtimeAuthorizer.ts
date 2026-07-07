import { userRepository } from "@/core/helpers/prisma/users/repository"
import { CognitoJwtVerifier } from "aws-jwt-verify"
import { realtime } from "sst/aws/realtime"

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

        const accessTopicPrefix = process.env.USER_ACCESS_REALTIME_TOPIC_PREFIX
        const notificationTopicPrefix = process.env.USER_NOTIFICATION_REALTIME_TOPIC_PREFIX
        const subscribe = [
            ...(accessTopicPrefix ? [`${accessTopicPrefix}/${sub}/access`] : []),
            ...(notificationTopicPrefix ? [`${notificationTopicPrefix}/${user.id}`] : []),
        ]

        return {
            subscribe,
            publish: [],
        }
    } catch (error) {
        console.error("Realtime authorizer rejected token", error)
        return emptyAuthResult()
    }
})
