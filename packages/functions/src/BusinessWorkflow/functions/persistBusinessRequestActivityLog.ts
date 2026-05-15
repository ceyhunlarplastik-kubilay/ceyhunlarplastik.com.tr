import { activityLogRepository } from "@/core/helpers/prisma/activityLogs/repository"
import { getApprovalRoleLabel, getBusinessRequestTypeLabel } from "@/core/helpers/businessRequests/messaging"
import type { BusinessWorkflowEvent } from "./types"

function buildActivityCopy(event: BusinessWorkflowEvent) {
    const detail = event.detail
    const typeLabel = getBusinessRequestTypeLabel(detail.type)

    switch (event["detail-type"]) {
        case "business-request.created":
            return {
                title: `${typeLabel} oluşturuldu`,
                description: `${detail.title} talebi onay akışına alındı.`,
            }
        case "business-request.pending-approval":
            return {
                title: `${typeLabel} onay bekliyor`,
                description: `${detail.title} talebi ${getApprovalRoleLabel(detail.requiredRole ?? "ADMIN")} onayı bekliyor.`,
            }
        case "business-request.step-approved":
            return {
                title: `${typeLabel} adımı onaylandı`,
                description: `${detail.title} talebinin ${getApprovalRoleLabel(detail.requiredRole ?? "ADMIN")} adımı onaylandı.`,
            }
        case "business-request.rejected":
            return {
                title: `${typeLabel} reddedildi`,
                description: `${detail.title} talebi reddedildi.`,
            }
        case "business-request.completed":
            return {
                title: `${typeLabel} onaylandı`,
                description: `${detail.title} talebinin onay akışı tamamlandı.`,
            }
        default:
            return {
                title: detail.title,
                description: null,
            }
    }
}

export async function handler(event: BusinessWorkflowEvent) {
    const detail = event.detail
    const copy = buildActivityCopy(event)

    await activityLogRepository().createLog({
        request: {
            connect: {
                id: detail.requestId,
            },
        },
        ...(detail.decidedByUserId
            ? {
                actorUser: {
                    connect: {
                        id: detail.decidedByUserId,
                    },
                },
            }
            : detail.requestedByUserId
                ? {
                    actorUser: {
                        connect: {
                            id: detail.requestedByUserId,
                        },
                    },
                }
                : {}),
        source: event.source,
        eventType: event["detail-type"],
        title: copy.title,
        description: copy.description,
        data: detail,
    })
}
