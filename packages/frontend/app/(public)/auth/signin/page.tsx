import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignInPageClient } from "@/features/auth/components/SignInPageClient"

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string; error?: string }>
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
            title="Yonetim paneline giris yapin"
            description="Uygulama ici giris deneyimi ozellestirildi. Kimlik dogrulama ise Cognito altyapisi uzerinden guvenli sekilde devam eder."
            sideTitle="Kontrollu erisim, tek oturum deneyimi"
            sideDescription="Admin, operasyon ve tedarikci akislari ayni kimlik dogrulama omurgasi ile calisir. Boylesi daha guvenli, daha izlenebilir ve bakimi daha profesyonel bir yapi saglar."
        >
            <SignInPageClient callbackUrl={callbackUrl} error={params.error} />
        </AuthShell>
    )
}
