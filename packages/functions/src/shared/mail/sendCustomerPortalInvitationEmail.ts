import { createTransport } from "nodemailer"
import { Resource } from "sst"

type SendCustomerPortalInvitationEmailInput = {
    to: string
    firstName?: string | null
    customerName: string
    invitedByName: string
    invitationUrl: string
    expiresAt: Date
}

let cachedTransporter: ReturnType<typeof createTransport> | null = null

// P1.3: Gmail kimlik bilgileri env'de değil, SST Secret olarak link'li
// (infra/ProtectedApi.ts, yalnız davet route'u). Link'lenen secret değerleri düz
// Lambda environment'ına YAZILMAZ; şifreli `resource.enc` bundle'ında taşınıp
// runtime'da çözülür — env-injection alternatifinde konsolda görünürlerdi.
function getRequiredSecret(name: "GmailSmtpUser" | "GmailSmtpAppPassword") {
    const value = Resource[name]?.value?.trim()

    if (!value) {
        throw new Error(`${name} secret is required for customer invitation emails`)
    }

    return value
}

function getTransporter() {
    if (cachedTransporter) return cachedTransporter

    const mode = (process.env.MAIL_TRANSPORT_MODE ?? "gmail").trim().toLowerCase()

    if (mode !== "gmail") {
        throw new Error(`Unsupported mail transport mode: ${mode}`)
    }

    cachedTransporter = createTransport({
        service: "gmail",
        auth: {
            user: getRequiredSecret("GmailSmtpUser"),
            pass: getRequiredSecret("GmailSmtpAppPassword"),
        },
    })

    return cachedTransporter
}

function formatSender() {
    const fromEmail = process.env.INVITE_FROM_EMAIL?.trim() || getRequiredSecret("GmailSmtpUser")
    const fromName = process.env.INVITE_FROM_NAME?.trim()

    return fromName ? `${fromName} <${fromEmail}>` : fromEmail
}

function formatInvitationExpiry(expiresAt: Date) {
    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Istanbul",
    }).format(expiresAt)
}

export async function sendCustomerPortalInvitationEmail({
    to,
    firstName,
    customerName,
    invitedByName,
    invitationUrl,
    expiresAt,
}: SendCustomerPortalInvitationEmailInput) {
    const transporter = getTransporter()
    const greetingName = firstName?.trim() || "Merhaba"
    const expiresAtLabel = formatInvitationExpiry(expiresAt)
    const subject = `${customerName} musteri portali daveti`

    await transporter.sendMail({
        from: formatSender(),
        to,
        subject,
        text: [
            `${greetingName},`,
            "",
            `${customerName} musteri portali icin bir davetiniz bulunuyor.`,
            `Daveti gonderen: ${invitedByName}`,
            `Son gecerlilik tarihi: ${expiresAtLabel}`,
            "",
            `Davet baglantisi: ${invitationUrl}`,
            "",
            "Baglanti tek kullanimliktir. Daveti kabul ettikten sonra sifrenizle giris yapabilirsiniz.",
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
                <p>${greetingName},</p>
                <p><strong>${customerName}</strong> musteri portali icin bir davetiniz bulunuyor.</p>
                <p>Davet gonderen: <strong>${invitedByName}</strong></p>
                <p>Son gecerlilik tarihi: <strong>${expiresAtLabel}</strong></p>
                <p>
                    <a
                        href="${invitationUrl}"
                        style="display: inline-block; padding: 12px 20px; border-radius: 12px; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 600;"
                    >
                        Daveti Kabul Et
                    </a>
                </p>
                <p>Baglanti tek kullanimliktir. Daveti kabul ettikten sonra sifrenizle giris yapabilirsiniz.</p>
                <p style="font-size: 12px; color: #64748b;">Baglanti acilmazsa bu adresi tarayiciniza yapistirin: ${invitationUrl}</p>
            </div>
        `,
    })
}
