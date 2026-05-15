import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { getApprovalRoleLabel, getBusinessRequestTypeLabel } from "@/core/helpers/businessRequests/messaging"
import type { ApprovalRole } from "@/prisma/generated/prisma/client"
import type { BusinessWorkflowEvent } from "./types"

const ses = new SESv2Client({})

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

async function resolveRecipients(event: BusinessWorkflowEvent) {
    const detail = event.detail

    if (event["detail-type"] === "business-request.pending-approval") {
        if (detail.assignedUserId) {
            const assigned = await userRepository().getUserById(detail.assignedUserId)
            return assigned ? [assigned.email] : []
        }

        const users = await userRepository().listActiveUsersByGroups(resolveRoleGroups(detail.requiredRole))
        return users.map((user) => user.email).filter(Boolean)
    }

    if ((event["detail-type"] === "business-request.completed" || event["detail-type"] === "business-request.rejected") && detail.requestedByEmail) {
        return [detail.requestedByEmail]
    }

    return []
}

function buildEmailCopy(event: BusinessWorkflowEvent) {
    const detail = event.detail
    const typeLabel = getBusinessRequestTypeLabel(detail.type)

    switch (event["detail-type"]) {
        case "business-request.pending-approval":
            return {
                subject: `Onay bekleyen talep: ${detail.title}`,
                body: `${detail.title} için ${getApprovalRoleLabel(detail.requiredRole ?? "ADMIN")} onayı bekleniyor.`,
            }
        case "business-request.completed":
            return {
                subject: `Talebiniz onaylandı: ${detail.title}`,
                body: `${typeLabel} talebiniz onaylandı.`,
            }
        case "business-request.rejected":
            return {
                subject: `Talebiniz reddedildi: ${detail.title}`,
                body: `${typeLabel} talebiniz reddedildi.`,
            }
        default:
            return null
    }
}

export async function handler(event: BusinessWorkflowEvent) {
    const sender = process.env.BUSINESS_WORKFLOW_FROM_EMAIL
    if (!sender) return

    const copy = buildEmailCopy(event)
    if (!copy) return

    const recipients = await resolveRecipients(event)
    if (recipients.length === 0) return

    await ses.send(new SendEmailCommand({
        FromEmailAddress: sender,
        Destination: {
            ToAddresses: recipients,
        },
        Content: {
            Simple: {
                Subject: {
                    Data: copy.subject,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><h2>${copy.subject}</h2><p>${copy.body}</p></div>`,
                        Charset: "UTF-8",
                    },
                    Text: {
                        Data: copy.body,
                        Charset: "UTF-8",
                    },
                },
            },
        },
    }))
}
