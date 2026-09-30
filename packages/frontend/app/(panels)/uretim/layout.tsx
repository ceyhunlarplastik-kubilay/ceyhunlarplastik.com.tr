import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { PanelShell } from "@/components/panels/PanelShell"
import { productionNavGroups } from "@/components/panels/navigation/productionNav"
import { canAccessPath } from "@/features/auth/lib/navigation"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"
import { ProductionLiveIndicator } from "@/features/production/realtime/components/ProductionLiveIndicator"
import { ProductionRealtimeProvider } from "@/features/production/realtime/components/ProductionRealtimeProvider"

export default async function ProductionLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Furetim&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    // Erişim kuralı tek yerde: giriş sonrası yönlendirme de aynı fonksiyonu kullanıyor.
    if (!canAccessPath(groups, "/uretim")) redirect("/?error=unauthorized")

    // Canlı güncelleme (4.4) panel başına bir kez: diğer planlayıcıların değişiklikleri açık ekranları tazeler.
    return (
        <ProductionRealtimeProvider>
            <PanelShell
                title="Üretim Planlama Paneli"
                subtitle="Üretim"
                navGroups={productionNavGroups}
                // Zil (4.5): gecikme, termin riski ve kalıp bakımı bildirimleri; tıklayınca ilgili sayfa.
                actionSlot={<><ProductionLiveIndicator /><NotificationBell viewport="desktop" /></>}
                mobileActionSlot={<><ProductionLiveIndicator compact /><NotificationBell viewport="mobile" /></>}
                user={{
                    name: session.user?.name,
                    email: session.user?.email,
                    image: session.user?.image,
                    groups,
                }}
            >
                {children}
            </PanelShell>
        </ProductionRealtimeProvider>
    )
}
