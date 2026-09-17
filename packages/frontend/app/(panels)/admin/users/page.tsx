import { Users } from "lucide-react"
import { UsersPageClient } from "@/features/admin/users/components/UsersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminUsersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Users className="size-20" strokeWidth={1.5} />}
                    title="Kullanıcılar yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <UsersPageClient />
        </PageLoadingGate>
    )
}
