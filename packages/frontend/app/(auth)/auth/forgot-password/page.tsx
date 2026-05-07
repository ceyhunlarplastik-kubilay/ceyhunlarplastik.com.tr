import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { ForgotPasswordPageClient } from "@/features/auth/components/ForgotPasswordPageClient"

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string; email?: string }>
}) {
    const session = await auth()
    const params = await searchParams
    const callbackUrl = params.callbackUrl || "/admin"

    if (session) {
        redirect(callbackUrl)
    }

    return (
        <AuthShell
            eyebrow="Ceyhunlar Plastik"
            title="Şifrenizi sıfırlayın"
            description="E-posta adresinizi doğrulayarak yeni şifre belirleme akışını başlatabilirsiniz."
            sideTitle="Kontrollü şifre yenileme akışı"
            sideDescription="Şifre sıfırlama akışı uygulama içinde ilerler, Cognito ise güvenli token ve kullanıcı işlemlerini yürütür."
        >
            <ForgotPasswordPageClient callbackUrl={callbackUrl} initialEmail={params.email} />
        </AuthShell>
    )
}
