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
            title="Kimlik doğrulama hatası"
            description="Oturum açma veya yönlendirme sırasında bir sorun oluştu. Aşağıdan güvenli akışa geri dönebilirsiniz."
            sideTitle="Hata olduğunda da kontrollü deneyim"
            sideDescription="Varsayılan hata ekranı yerine, kullanıcıya ne olduğunu anlatan ve doğru aksiyona yönlendiren özel bir deneyim sunulur."
        >
            <AuthErrorPanel error={params.error} />
        </AuthShell>
    )
}
