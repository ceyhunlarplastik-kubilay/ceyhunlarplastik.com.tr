import createError from "http-errors"

import { buildUserDisplayName } from "@/core/helpers/users/displayName"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

import type { AuditContext, AuditUserActor } from "./types"

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

/** Aktör künyesinin okunduğu kullanıcı alanları (`IAuthenticatedUser` ya da DB `User`). */
export type AuditUserLike = {
    id: string
    cognitoSub: string
    email: string
    firstName?: string | null
    lastName?: string | null
    identifier?: string | null
    groups: string[]
}

export function auditActorFromUser(user: AuditUserLike): AuditUserActor {
    return {
        type: "USER",
        userId: user.id,
        cognitoSub: user.cognitoSub,
        email: user.email,
        name: buildUserDisplayName(user) || user.email,
        groups: [...user.groups],
    }
}

/** İstek künyesi: uç, API Gateway requestId (CloudWatch correlationId), IP ve tarayıcı. */
function requestTrace(event: AuditableApiEvent): Omit<AuditContext, "actor"> {
    const http = event.requestContext?.http

    return {
        source: event.routeKey?.trim() || "unknown",
        requestId: event.requestContext?.requestId || null,
        ipAddress: http?.sourceIp || null,
        userAgent: http?.userAgent?.slice(0, USER_AGENT_MAX_LENGTH) || null,
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

    return { actor: auditActorFromUser(user), ...requestTrace(event) }
}

/**
 * Kimliği JWT'den değil, akışın kendisinden doğrulanan kullanıcı için bağlam — ör. davet
 * kabulü: public uç, ama kişi tek kullanımlık davet jetonuyla kendini kanıtlamıştır ve
 * DB kullanıcısı bellidir. Kullanıcıyı ÇAĞIRAN doğrular; bu fonksiyon yalnız künyeyi kurar.
 */
export function buildUserAuditContext(user: AuditUserLike, event: AuditableApiEvent): AuditContext {
    return { actor: auditActorFromUser(user), ...requestTrace(event) }
}

/**
 * Giriş yapmamış kişi (sitedeki public form). Kimlik YOK — `name` yalnız kaynağı anlatır
 * ("Web formu"); IP ve tarayıcı spam / kötüye kullanım incelemesi için kayda girer.
 * Yalnız gerçekten anonim olan public uçlarda kullan.
 */
export function buildAnonymousAuditContext(event: AuditableApiEvent, name: string): AuditContext {
    return { actor: { type: "ANONYMOUS", name }, ...requestTrace(event) }
}
