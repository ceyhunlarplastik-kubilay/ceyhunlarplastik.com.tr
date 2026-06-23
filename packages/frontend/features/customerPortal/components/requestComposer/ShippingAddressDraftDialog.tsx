"use client"

import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { CustomerAddressFormDialog } from "@/features/customerLocations/components/CustomerAddressFormDialog"

export function ShippingAddressDraftDialog({
    open,
    onOpenChange,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (address: AddressDraftFormValues) => void
}) {
    return (
        <CustomerAddressFormDialog
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={(address) => {
                onSave(address)
                onOpenChange(false)
            }}
            initialValues={null}
            title="Yeni Sevkiyat Adresi"
            description="Bu adres yalnızca mevcut sipariş talebi için kullanılır. Adres araması veya harita üzerinden konum seçebilirsiniz."
            submitLabel="Adresi Siparişe Ekle"
        />
    )
}
