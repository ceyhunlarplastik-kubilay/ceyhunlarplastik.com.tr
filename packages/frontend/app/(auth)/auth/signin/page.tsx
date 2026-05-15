import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignInPageClient } from "@/features/auth/components/SignInPageClient"
import { canAccessPath, getCallbackPathname, resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string; error?: string; email?: string; notice?: string }>
}) {
    const session = await auth()
    const params = await searchParams
    const callbackUrl = params.callbackUrl || "/admin"

    if (session) {
        const groups = session.user?.groups ?? []
        const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
        const callbackPathname = getCallbackPathname(callbackUrl)

        if (accessStatus !== "ACTIVE") {
            redirect("/hesabim")
        }

        if (canAccessPath(groups, callbackPathname)) {
            redirect(callbackUrl)
        }

        redirect(resolveAuthHome(groups, accessStatus))
    }

    return (
        <AuthShell
            eyebrow="Ceyhunlar Plastik"
            title="Yönetim paneline giriş yapın"
            description="Kimlik doğrulama ekranları uygulama içinde, Türkçe ve marka uyumlu olarak yönetilir."
            sideTitle="Kontrollü erişim, tek oturum deneyimi"
            sideDescription="Admin, operasyon ve tedarikçi akışları aynı kimlik omurgası ile çalışır. Sonuç daha güvenli, daha izlenebilir ve daha profesyonel bir oturum deneyimidir."
        >
            <SignInPageClient
                callbackUrl={callbackUrl}
                error={params.error}
                initialEmail={params.email}
                notice={params.notice}
            />
        </AuthShell>
    )
}
