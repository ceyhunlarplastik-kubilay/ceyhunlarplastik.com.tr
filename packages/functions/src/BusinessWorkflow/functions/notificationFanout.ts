import { getApprovalRoleLabel, getBusinessRequestTypeLabel } from "@/core/helpers/businessRequests/messaging"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import type { ApprovalRole } from "@/prisma/generated/prisma/client"
import type { BusinessWorkflowEvent } from "./types"

export type BusinessWorkflowNotificationTarget = {
    id: string
    email: string
    identifier: string
    groups: string[]
}

export type BusinessWorkflowNotificationCopy = {
    type: "REQUEST_CREATED" | "APPROVAL_REQUIRED" | "REQUEST_DECIDED"
    title: string
    message: string
}

function resolveRoleGroups(role: ApprovalRole | null | undefined) {
    switch (role) {
        case "SALES":
            return ["sales"]
        case "SALES_DIRECTOR":
            return ["sales_director"]
        case "PURCHASING":
            return ["purchasing"]
        case "ADMIN":
            return ["admin", "owner"]
        case "OWNER":
            return ["owner"]
        default:
            return []
    }
}

function dedupeTargets(targets: BusinessWorkflowNotificationTarget[]) {
    const seen = new Set<string>()
    return targets.filter((target) => {
        if (seen.has(target.id)) return false
        seen.add(target.id)
        return true
    })
}

export async function resolveBusinessWorkflowNotificationTargets(event: BusinessWorkflowEvent) {
    const detail = event.detail
    const repo = userRepository()

    switch (event["detail-type"]) {
        case "business-request.created":
        case "business-request.completed":
        case "business-request.rejected":
            if (!detail.requestedByUserId) return []
            return [
                {
                    id: detail.requestedByUserId,
                    email: detail.requestedByEmail ?? "",
                    identifier: detail.requestedByEmail ?? detail.requestedByUserId,
                    groups: [],
                },
            ]
        case "business-request.pending-approval": {
            const targets: BusinessWorkflowNotificationTarget[] = []

            if (detail.assignedUserId) {
                const assigned = await repo.getUserById(detail.assignedUserId)
                if (assigned) {
                    targets.push({
                        id: assigned.id,
                        email: assigned.email,
                        identifier: assigned.identifier,
                        groups: assigned.groups,
                    })
                }
            } else {
                targets.push(...await repo.listActiveUsersByGroups(resolveRoleGroups(detail.requiredRole)))
            }

            if (detail.type === "CUSTOMER_ORDER_REQUEST") {
                targets.push(...await repo.listActiveUsersByGroups(["admin", "owner"]))
            }

            return dedupeTargets(targets)
        }
        default:
            return []
    }
}

export function buildBusinessWorkflowNotificationCopy(event: BusinessWorkflowEvent): BusinessWorkflowNotificationCopy | null {
    const detail = event.detail
    const typeLabel = getBusinessRequestTypeLabel(detail.type)

    switch (event["detail-type"]) {
        case "business-request.created":
            return {
                type: "REQUEST_CREATED",
                title: "Talebiniz kaydedildi",
                message: `${typeLabel} talebiniz onay akışına alındı.`,
            }
        case "business-request.pending-approval":
            return {
                type: "APPROVAL_REQUIRED",
                title: "Onay bekleyen yeni talep",
                message: `${detail.title} için ${getApprovalRoleLabel(detail.requiredRole ?? "ADMIN")} onayı bekleniyor.`,
            }
        case "business-request.completed":
            return {
                type: "REQUEST_DECIDED",
                title: "Talebiniz onaylandı",
                message: `${typeLabel} talebiniz onaylandı.`,
            }
        case "business-request.rejected":
            return {
                type: "REQUEST_DECIDED",
                title: "Talebiniz reddedildi",
                message: `${typeLabel} talebiniz reddedildi.`,
            }
        default:
            return null
    }
}
