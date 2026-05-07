import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { ConfirmSignUpPageClient } from "@/features/auth/components/ConfirmSignUpPageClient"

export default async function ConfirmSignUpPage({
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
            title="Hesabınızı doğrulayın"
            description="Kayıt sonrası gönderilen doğrulama kodunu girerek hesabınızı aktif hale getirin."
            sideTitle="İlk adımı doğrulama ile tamamlayın"
            sideDescription="Doğrulama tamamlandığında kullanıcı hesabı aktif olur ve standart giriş akışına geçilir."
        >
            <ConfirmSignUpPageClient callbackUrl={callbackUrl} initialEmail={params.email} />
        </AuthShell>
    )
}
