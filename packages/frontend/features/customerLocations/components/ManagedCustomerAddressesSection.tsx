"use client"

import { useMemo, useState } from "react"
import { MapPin, Pencil, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AdminCustomer, CustomerAddress } from "@/features/admin/customers/api/types"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { CustomerAddressFormDialog } from "@/features/customerLocations/components/CustomerAddressFormDialog"
import { buildGoogleMapsDirectionsUrl } from "@/features/customerLocations/lib/buildGoogleMapsDirectionsUrl"
import { toAddressDraftValues } from "@/features/customerLocations/lib/toAddressDraftValues"
import { useCreateManagedCustomerAddress } from "@/features/customerLocations/hooks/useCreateManagedCustomerAddress"
import { useDeleteManagedCustomerAddress } from "@/features/customerLocations/hooks/useDeleteManagedCustomerAddress"
import { useUpdateManagedCustomerAddress } from "@/features/customerLocations/hooks/useUpdateManagedCustomerAddress"

type Props = {
    customer: AdminCustomer
}

function buildAddressRows(address: CustomerAddress) {
    return [
        address.line1 ? { label: "Adres", value: address.line1 } : null,
        address.line2 ? { label: "Devam", value: address.line2 } : null,
        [address.district, address.city, address.stateRef?.name].filter(Boolean).length > 0
            ? { label: "Bölge", value: [address.district, address.city, address.stateRef?.name].filter(Boolean).join(" / ") }
            : null,
        address.country ? { label: "Ülke", value: address.country } : null,
        address.contactName ? { label: "İrtibat", value: address.contactName } : null,
        address.phone ? { label: "Telefon", value: address.phone } : null,
        address.email ? { label: "E-posta", value: address.email } : null,
        address.postalCode ? { label: "Posta Kodu", value: address.postalCode } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>
}

export function ManagedCustomerAddressesSection({ customer }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
    const createMutation = useCreateManagedCustomerAddress(customer.id)
    const updateMutation = useUpdateManagedCustomerAddress(customer.id, editingAddress?.id ?? "")
    const deleteMutation = useDeleteManagedCustomerAddress(customer.id, editingAddress?.id ?? "")
    const initialValues = useMemo(() => toAddressDraftValues(editingAddress), [editingAddress])

    async function handleSubmit(values: AddressDraftFormValues) {
        if (editingAddress) {
            await updateMutation.mutateAsync(values)
        } else {
            await createMutation.mutateAsync(values)
        }

        setDialogOpen(false)
        setEditingAddress(null)
    }

    async function handleDelete() {
        if (!editingAddress) return

        await deleteMutation.mutateAsync()
        setDialogOpen(false)
        setEditingAddress(null)
    }

    return (
        <>
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                            <MapPin className="h-4 w-4" />
                            Adresler ve Konum
                        </div>
                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                            Müşteri adreslerini harita konumuyla birlikte yönetin. Harita ekranında gösterilecek pin bu adresler arasından seçilir.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => {
                            setEditingAddress(null)
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Adres
                    </Button>
                </div>

                {(customer.addresses?.length ?? 0) > 0 ? (
                    <div className="grid gap-3 xl:grid-cols-2">
                        {customer.addresses?.map((address) => {
                            const rows = buildAddressRows(address)
                            return (
                                <article key={address.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="text-base font-semibold text-neutral-950">{address.label}</div>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {address.isPrimary ? <Badge variant="secondary">Birincil</Badge> : null}
                                                {address.isBilling ? <Badge variant="outline">Fatura</Badge> : null}
                                                {address.isShipping ? <Badge variant="outline">Sevkiyat</Badge> : null}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingAddress(address)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Düzenle
                                        </Button>
                                    </div>

                                    <div className="mt-4 space-y-2.5">
                                        {rows.map((row) => (
                                            <div key={`${address.id}-${row.label}`} className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-3">
                                                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">{row.label}</span>
                                                <span className="text-sm leading-6 text-neutral-800">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {address.latitude != null && address.longitude != null ? (
                                            <Button asChild type="button" size="sm" variant="outline">
                                                <a
                                                    href={buildGoogleMapsDirectionsUrl(address.latitude, address.longitude)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Google Maps’te Yol Tarifi
                                                </a>
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-amber-700">Harita koordinatı henüz seçilmemiş.</span>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
                        Tanımlı adres bulunmuyor.
                    </div>
                )}
            </div>

            <CustomerAddressFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) {
                        setEditingAddress(null)
                    }
                }}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onDelete={editingAddress ? handleDelete : undefined}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                isDeleting={deleteMutation.isPending}
                title={editingAddress ? "Adresi Düzenle" : "Yeni Adres"}
                description={editingAddress
                    ? "Adres, koordinat ve operasyon etiketlerini güncelleyin."
                    : "Adres detayını girin, haritada konumu seçin ve müşteriye kaydedin."}
                submitLabel={editingAddress ? "Güncelle" : "Kaydet"}
            />
        </>
    )
}
