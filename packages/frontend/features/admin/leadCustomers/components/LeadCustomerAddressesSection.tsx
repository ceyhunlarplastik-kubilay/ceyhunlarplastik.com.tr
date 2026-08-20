"use client"

import { useMemo, useState } from "react"
import { MapPin, Pencil, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CustomerAddress } from "@/features/admin/customers/api/types"
import { CustomerAddressFormDialog } from "@/features/customerLocations/components/CustomerAddressFormDialog"
import { normalizeAddressPayload } from "@/features/customerLocations/lib/addressPayload"
import { toAddressDraftValues } from "@/features/customerLocations/lib/toAddressDraftValues"
import { useLeadCustomerAddressMutations } from "@/features/admin/leadCustomers/hooks/useLeadCustomers"

/**
 * Adres formu, harita seçicisi ve ülke/il/ilçe alanları PAYLAŞILAN
 * `CustomerAddressFormDialog`'tan gelir — satış paneli ve müşteri portalı da
 * aynı bileşeni kullanıyor, burada kopyası yok.
 */
export function LeadCustomerAddressesSection({
    customerId,
    addresses,
}: {
    customerId: string
    addresses: CustomerAddress[]
}) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)

    // Her render'da yeni nesne üretilirse dialog'un reset efekti tetiklenir ve
    // açık formdaki kaydedilmemiş girdi (seçilen koordinat dahil) silinir.
    const initialValues = useMemo(
        () => (editingAddress ? toAddressDraftValues(editingAddress) : null),
        [editingAddress],
    )

    const { create, update, remove } = useLeadCustomerAddressMutations(customerId)
    const isSubmitting = create.isPending || update.isPending

    function openCreate() {
        setEditingAddress(null)
        setDialogOpen(true)
    }

    function openEdit(address: CustomerAddress) {
        setEditingAddress(address)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand" />
                    <span className="text-sm font-medium text-neutral-800">
                        Adresler
                    </span>
                    <Badge variant="outline" className="rounded-full text-[11px] font-normal">
                        {addresses.length}
                    </Badge>
                </div>

                <Button type="button" variant="outline" size="sm" className="rounded-2xl" onClick={openCreate}>
                    <Plus className="h-3.5 w-3.5" />
                    Adres Ekle
                </Button>
            </div>

            {addresses.length === 0 ? (
                <button
                    type="button"
                    onClick={openCreate}
                    className="w-full rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-5 text-center text-xs text-neutral-500 transition hover:border-brand/40 hover:bg-brand/5"
                >
                    Henüz adres eklenmemiş — eklemek için tıklayın. Konum haritadan seçilir;
                    ziyaret planlama ve sevkiyat için gereklidir.
                </button>
            ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className="rounded-2xl border border-neutral-200 bg-white p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-medium text-neutral-950">
                                            {address.label}
                                        </span>
                                        {address.isPrimary ? (
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-brand/30 bg-brand/5 text-[10px] font-medium text-brand"
                                            >
                                                birincil
                                            </Badge>
                                        ) : null}
                                    </div>

                                    <p className="mt-1 line-clamp-2 text-xs leading-4 text-neutral-600">
                                        {address.line1}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-neutral-400">
                                        {[address.district, address.city, address.stateRef?.name, address.country]
                                            .filter(Boolean)
                                            .join(" / ")}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 rounded-xl"
                                    onClick={() => openEdit(address)}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CustomerAddressFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initialValues={initialValues}
                defaultLabel={addresses.length === 0 ? "Merkez" : ""}
                defaultIsPrimary={addresses.length === 0}
                defaultIsShipping={false}
                isSubmitting={isSubmitting}
                isDeleting={remove.isPending}
                title={editingAddress ? "Adresi Düzenle" : "Yeni Adres"}
                description="Ülke, il ve ilçeyi seçin, ardından haritadan tam konumu işaretleyin."
                submitLabel={editingAddress ? "Adresi Güncelle" : "Adresi Kaydet"}
                onSubmit={async (values) => {
                    const payload = normalizeAddressPayload(values)

                    if (editingAddress) {
                        await update.mutateAsync({ addressId: editingAddress.id, body: payload })
                    } else {
                        await create.mutateAsync(payload)
                    }

                    setDialogOpen(false)
                }}
                onDelete={
                    editingAddress
                        ? async () => {
                            await remove.mutateAsync(editingAddress.id)
                            setDialogOpen(false)
                        }
                        : undefined
                }
            />
        </div>
    )
}
