import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignUpPageClient } from "@/features/auth/components/SignUpPageClient"

export default async function SignUpPage({
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
            title="Yeni hesap oluşturun"
            description="Türkçe kayıt akışı ile kullanıcı hesabınızı birkaç adımda oluşturup doğrulama ekranına geçebilirsiniz."
            sideTitle="İç ekipler ve iş ortakları için kontrollü kayıt"
            sideDescription="Hesap oluşturma, doğrulama ve ilk giriş adımları aynı güvenlik omurgası üzerinde, uygulama içi deneyim korunarak ilerler."
        >
            <SignUpPageClient callbackUrl={callbackUrl} initialEmail={params.email} />
        </AuthShell>
    )
}
