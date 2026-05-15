import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { buildUserAccessChangedMessage, getUserAccessStatusLabel, getUserGroupLabel } from "@/core/helpers/userAccess/messaging"
import type { UserAccessUpdateEvent } from "./types"

const ses = new SESv2Client({})

export async function handler(event: UserAccessUpdateEvent) {
    const detail = event.detail
    const sender = process.env.USER_ACCESS_FROM_EMAIL

    if (!sender) {
        console.warn("USER_ACCESS_FROM_EMAIL missing; skipping user access email")
        return
    }

    const message = buildUserAccessChangedMessage({
        nextGroup: detail.nextGroups[0] ?? "user",
        nextAccessStatus: detail.nextAccessStatus,
        reason: detail.reason,
    })

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin-bottom:12px;">${message.title}</h2>
        <p>${message.message}</p>
        <p><strong>Yeni rol:</strong> ${getUserGroupLabel(detail.nextGroups[0] ?? "user")}</p>
        <p><strong>Durum:</strong> ${getUserAccessStatusLabel(detail.nextAccessStatus)}</p>
        <p><strong>Güncelleyen:</strong> ${detail.changedByEmail}</p>
        <p style="margin-top:20px;color:#6b7280;">Yetkileriniz değiştiyse yeni izinlerinizi görmek için oturumunuzu yenileyin.</p>
      </div>
    `

    await ses.send(new SendEmailCommand({
        FromEmailAddress: sender,
        Destination: {
            ToAddresses: [detail.email],
        },
        Content: {
            Simple: {
                Subject: {
                    Data: message.title,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: html,
                        Charset: "UTF-8",
                    },
                    Text: {
                        Data: `${message.message}\nYeni rol: ${getUserGroupLabel(detail.nextGroups[0] ?? "user")}\nDurum: ${getUserAccessStatusLabel(detail.nextAccessStatus)}\nGüncelleyen: ${detail.changedByEmail}\nYetkileriniz değiştiyse yeni izinlerinizi görmek için oturumunuzu yenileyin.`,
                        Charset: "UTF-8",
                    },
                },
            },
        },
    }))
}
