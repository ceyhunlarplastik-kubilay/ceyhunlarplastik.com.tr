import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { ResetPasswordPageClient } from "@/features/auth/components/ResetPasswordPageClient"

export default async function ResetPasswordPage({
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
            title="Yeni şifrenizi oluşturun"
            description="E-posta ile gelen kodu kullanarak hesabınız için yeni şifre tanımlayın."
            sideTitle="Tek kullanımlık doğrulama ile şifre yenileyin"
            sideDescription="Bu akış güvenliği korurken kullanıcıya Türkçe ve sade bir deneyim sunar."
        >
            <ResetPasswordPageClient callbackUrl={callbackUrl} initialEmail={params.email} />
        </AuthShell>
    )
}
