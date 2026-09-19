"use client"

import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useManagedLeadCustomer } from "@/features/sales/leadCustomers/hooks/useManagedLeadCustomer"
import { useInviteManagedCustomer } from "@/features/sales/customers/hooks/useInviteManagedCustomer"
import { CustomerProfileMatchedProducts } from "@/features/crm/components/CustomerProfileMatchedProducts"
import { ReadOnlyAddressList } from "@/features/crm/components/ReadOnlyAddressList"
import { CustomerPortalUserInviteDialog } from "@/features/customerPortal/components/CustomerPortalUserInviteDialog"
import type { LeadCustomerDetail } from "@/features/admin/leadCustomers/api/types"

/**
 * `LeadCustomerDetailPanel`in (veri girişi) satış paneli karşılığı — AYNI
 * `GET .../lead-customers/{id}` şeklini kullanır (`/sales/lead-customers/{id}`,
 * salt-okunur boundary) ama adres CRUD'u YOK: kullanıcı talebiyle adres
 * ekleme/düzenleme veri girişi panelinin sorumluluğunda kalıyor, burada
 * yalnız görüntülenir (`ReadOnlyAddressList` — cari müşteri karşılığıyla
 * `SalesActiveCustomerDetailPanel` paylaşılır).
 *
 * "Portale Davet Et": müşteri portalının kendi kullanıcısının meslektaşını
 * davet ettiği AYNI dialog/form (`CustomerPortalUserInviteDialog`) reuse
 * edilir — satış temsilcisi burada HENÜZ portal hesabı olmayan bir LEAD'i
 * davet eder. Davet kabul edildiğinde müşteri otomatik CUSTOMER'a döner
 * (bkz. `acceptCustomerPortalInvitation`), bu kayıt bir sonraki listelemede
 * Potansiyel Müşteriler'den kalkıp Cari Müşteriler'de görünür.
 */
export function SalesLeadCustomerDetailPanel({ customerId }: { customerId: string }) {
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const detailQuery = useManagedLeadCustomer(customerId)
    const inviteMutation = useInviteManagedCustomer(customerId)
    const detail = detailQuery.data

    if (detailQuery.isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Müşteri detayı yükleniyor
            </div>
        )
    }

    if (!detail) return null

    const hasProfile =
        Boolean(detail.sectorValue) || Boolean(detail.productionGroupValue) || detail.usageAreaValues.length > 0

    return (
        <div className="space-y-5">
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setInviteDialogOpen(true)}
                >
                    <UserPlus className="h-3.5 w-3.5" />
                    Portale Davet Et
                </Button>
            </div>

            <ReadOnlyAddressList addresses={detail.addresses} />

            <div className="h-px bg-neutral-200" />

            <CustomerProfileMatchedProducts
                hasProfile={hasProfile}
                matchedProductCount={detail.matchedProductCount}
                matchedProducts={detail.matchedProducts}
                viewAllHref={hasProfile ? buildFilteredProductsHref(detail) : undefined}
            />

            <CustomerPortalUserInviteDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                isSubmitting={inviteMutation.isPending}
                onSubmit={async (values) => {
                    await inviteMutation.mutateAsync(values)
                    setInviteDialogOpen(false)
                }}
            />
        </div>
    )
}

function buildFilteredProductsHref(detail: LeadCustomerDetail) {
    const params = new URLSearchParams()

    if (detail.sectorValue) params.set("sector", detail.sectorValue.slug)
    if (detail.productionGroupValue) params.set("production_group", detail.productionGroupValue.slug)
    if (detail.usageAreaValues.length > 0) {
        params.set("usage_area", detail.usageAreaValues.map((value) => value.slug).join(","))
    }

    return `/musteri-temsilcisi/urunler?${params.toString()}`
}
