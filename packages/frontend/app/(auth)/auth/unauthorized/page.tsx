import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { UnauthorizedPageContent } from "@/features/auth/components/UnauthorizedPageContent"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function UnauthorizedPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string }>
}) {
    const session = await auth()
    const params = await searchParams
    const groups = session?.user?.groups ?? []

    return (
        <AuthShell
            eyebrow="Erişim Kontrolü"
            title="Yetki yetersiz"
            description="Talep ettiğiniz sayfa farklı bir rol veya çalışma alanı gerektiriyor."
            sideTitle="Doğru panele yönlendirme"
            sideDescription="Rol bazlı sistem koruması nedeniyle uygun olmayan alanlar kapatılır ve kullanıcı doğru hedefe yönlendirilir."
        >
            <UnauthorizedPageContent homeHref={resolveAuthHome(groups)} from={params.from} />
        </AuthShell>
    )
}
