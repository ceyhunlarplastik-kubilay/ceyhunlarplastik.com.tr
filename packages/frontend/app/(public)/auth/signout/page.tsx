import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignOutPageClient } from "@/features/auth/components/SignOutPageClient"

export default function SignOutPage() {
    return (
        <AuthShell
            eyebrow="Ceyhunlar Plastik"
            title="Oturumu kapat"
            description="Gecerli uygulama ve Cognito oturumunuzu kontrollu bicimde kapatabilirsiniz."
            sideTitle="Guvenli cikis akisi"
            sideDescription="Bu ekran cikis deneyimini sade ve kontrollu hale getirir. Cikis sonrasi kullanici tekrar ozel giris ekranina dondurulur."
        >
            <SignOutPageClient />
        </AuthShell>
    )
}
