"use client"

import { useState } from "react"
import { Plus, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CustomerContactCarousel } from "@/components/ui/customer-contact-carousel"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import { CustomerPortalUserInviteDialog } from "@/features/customerPortal/components/CustomerPortalUserInviteDialog"
import { useCreatePortalCustomerUser } from "@/features/customerPortal/hooks/useCreatePortalCustomerUser"
import type { CustomerPortalUserInviteFormValues } from "@/features/customerPortal/schema/customerPortalUserInvite"
import { buildCustomerContactCards } from "@/lib/customers/contactCards"

type Props = {
    customer: AdminCustomer
}

function AddUserCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Yeni kullanıcı ekle"
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,250,252,0.94))] p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_22px_50px_-32px_rgba(15,23,42,0.4)] sm:p-6"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,185,102,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.06),transparent_38%)] opacity-90" />
            <div className="relative flex h-full flex-col gap-4">
                <div className="inline-flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                    <span className="inline-flex rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 shadow-sm">
                        <UserRound className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">Portal Kullanıcısı</span>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-brand/25 bg-white/70 px-6 py-8 text-center">
                    <div className="flex size-18 items-center justify-center rounded-full border border-brand/15 bg-brand/10 text-brand shadow-[0_14px_35px_-26px_color-mix(in_oklch,var(--color-brand),black_20%)] transition group-hover:scale-105">
                        <Plus className="size-7" />
                    </div>
                    <div className="mt-4 text-lg font-semibold tracking-tight text-slate-950">Yeni Kullanıcı Ekle</div>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                        Aynı müşteri hesabına bağlı yeni portal kullanıcısı davet edin.
                    </p>
                </div>
            </div>
        </button>
    )
}

export function CustomerPortalUsersCarousel({ customer }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const createMutation = useCreatePortalCustomerUser()
    const contacts = buildCustomerContactCards(customer).map((contact) => ({
        ...contact,
        description: contact.portalOnboardingState === "INVITED"
            ? "Davet gonderildi. Kullanici sifresini olusturduktan sonra portala giris yapabilir."
            : contact.isPrimary
                ? "Portal, talep ve siparis akisinda kullanilan ana musteri hesabi."
                : "Bu musteri icin ek portal ve operasyon iletisim kisisi.",
        badge: contact.portalOnboardingState === "INVITED"
            ? <Badge variant="secondary">Davet Gonderildi</Badge>
            : <Badge variant={contact.isPrimary ? "default" : "secondary"}>{contact.isPrimary ? "Ana Yetkili" : "Portal"}</Badge>,
    }))

    async function handleSubmit(values: CustomerPortalUserInviteFormValues) {
        await createMutation.mutateAsync(values)
        setDialogOpen(false)
    }

    return (
        <>
            <CustomerContactCarousel
                contacts={contacts}
                eyebrow="Müşteri Portal Kullanıcıları"
                icon={UserRound}
                className="h-full"
                trailingItem={<AddUserCard onClick={() => setDialogOpen(true)} />}
                trailingItemKey="portal-user-invite-card"
            />
            <CustomerPortalUserInviteDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending}
            />
        </>
    )
}
