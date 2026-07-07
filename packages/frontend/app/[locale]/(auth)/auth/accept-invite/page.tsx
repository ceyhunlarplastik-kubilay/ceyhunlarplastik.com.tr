import { AuthShell } from "@/features/auth/components/AuthShell"
import { AcceptCustomerInvitationPageClient } from "@/features/customerInvitations/components/AcceptCustomerInvitationPageClient"

export default async function AcceptInvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const params = await searchParams

    return (
        <AuthShell
            eyebrow="Müşteri Portalı"
            title="Davetinizi kabul edin"
            description="Portal hesabınız için kalıcı şifrenizi belirleyin."
            sideTitle="Müşteri kullanıcı daveti"
            sideDescription="Davet bağlantısı üzerinden kullanıcı hesabı tamamlanır ve portal erişimi aktive edilir."
        >
            <AcceptCustomerInvitationPageClient initialToken={params.token} />
        </AuthShell>
    )
}
