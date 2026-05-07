import { AuthShell } from "@/features/auth/components/AuthShell"
import { AuthErrorPanel } from "@/features/auth/components/AuthErrorPanel"

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams

    return (
        <AuthShell
            eyebrow="Ceyhunlar Plastik"
            title="Kimlik dogrulama hatasi"
            description="Oturum acma veya yonlendirme sirasinda bir sorun olustu. Asagidan akisa geri donebilirsiniz."
            sideTitle="Hata oldugunda da kontrollu deneyim"
            sideDescription="Varsayilan NextAuth hata sayfasi yerine, kullaniciyi ne oldugunu anlatan ve dogru aksiyona yonlendiren bir ekran kullaniliyor."
        >
            <AuthErrorPanel error={params.error} />
        </AuthShell>
    )
}
