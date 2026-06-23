"use client"

import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { CustomerAddressFormDialog } from "@/features/customerLocations/components/CustomerAddressFormDialog"

export function CustomerPortalAddressRequestDialog({
    open,
    onOpenChange,
    onSubmit,
    onDelete,
    initialValues,
    isSubmitting = false,
    isDeleting = false,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (address: AddressDraftFormValues) => Promise<void> | void
    onDelete?: () => Promise<void> | void
    initialValues?: AddressDraftFormValues | null
    isSubmitting?: boolean
    isDeleting?: boolean
}) {
    return (
        <CustomerAddressFormDialog
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            onDelete={onDelete}
            initialValues={initialValues}
            isSubmitting={isSubmitting}
            isDeleting={isDeleting}
            title={initialValues ? "Adresi Düzenle" : "Yeni Adres"}
            description={initialValues
                ? "Adres ve harita konumunu güncelleyin. Değişiklikler doğrudan müşteri profilinize işlenir."
                : "Adres ve harita konumunu seçin. Kayıt doğrudan müşteri profilinize eklenir."}
            submitLabel={initialValues ? "Güncelle" : "Kaydet"}
        />
    )
}
