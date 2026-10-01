import createError from "http-errors"

import { buildUserDisplayName } from "@/core/helpers/users/displayName"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

import type { AuditContext } from "./types"

const USER_AGENT_MAX_LENGTH = 512

/** Audit bağlamının okuduğu olay alanları — API Gateway v2 olayının alt kümesi. */
export type AuditableApiEvent = {
    user?: IAuthenticatedUser
    routeKey?: string
    requestContext?: {
        requestId?: string
        http?: {
            sourceIp?: string
            userAgent?: string
        }
    }
}

/**
 * API isteğinden audit bağlamını kurar.
 *
 * Aktör YALNIZ `authMiddleware`'in doğruladığı kimlikten (`event.user`) gelir; gövdeden,
 * query'den ya da başlıktan OKUNMAZ — istemcinin "ben şuyum" demesiyle kayıt atılamaz.
 * `event.user` yoksa 401 atar: kimliksiz yazma denetlenemez, o yüzden yapılmaz.
 */
export function buildAuditContextFromEvent(event: AuditableApiEvent): AuditContext {
    const user = event.user
    if (!user) throw new createError.Unauthorized("Authentication required")

    const http = event.requestContext?.http

    return {
        actor: {
            type: "USER",
            userId: user.id,
            cognitoSub: user.cognitoSub,
            email: user.email,
            name: buildUserDisplayName(user) || user.email,
            groups: [...user.groups],
        },
        source: event.routeKey?.trim() || "unknown",
        requestId: event.requestContext?.requestId || null,
        ipAddress: http?.sourceIp || null,
        userAgent: http?.userAgent?.slice(0, USER_AGENT_MAX_LENGTH) || null,
    }
}
