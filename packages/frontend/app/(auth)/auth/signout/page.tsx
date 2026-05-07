import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignOutPageClient } from "@/features/auth/components/SignOutPageClient"

export default function SignOutPage() {
    return (
        <AuthShell
            eyebrow="Ceyhunlar Plastik"
            title="Oturumu kapat"
            description="Geçerli uygulama oturumunuzu ve yenileme belirtecinizi kontrollü biçimde kapatabilirsiniz."
            sideTitle="Güvenli çıkış akışı"
            sideDescription="Çıkış deneyimi sade ve kontrollü şekilde tamamlanır. İşlem sonrası kullanıcı tekrar özel giriş ekranına döner."
        >
            <SignOutPageClient />
        </AuthShell>
    )
}
