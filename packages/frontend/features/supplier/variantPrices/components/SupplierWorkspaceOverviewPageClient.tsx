"use client"

import { Building2, Pencil } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CreateSupplierCategoryRequestDialog } from "@/features/supplier/businessRequests/components/CreateSupplierCategoryRequestDialog"
import { CreateSupplierProductRequestDialog } from "@/features/supplier/businessRequests/components/CreateSupplierProductRequestDialog"
import { EditSupplierProfileDialog } from "@/features/supplier/variantPrices/components/EditSupplierProfileDialog"
import { useSupplierProfile } from "@/features/supplier/variantPrices/hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "@/features/supplier/variantPrices/hooks/useUpdateSupplierProfile"

export function SupplierWorkspaceOverviewPageClient() {
    const [profileDialogOpen, setProfileDialogOpen] = useState(false)
    const [categoryRequestOpen, setCategoryRequestOpen] = useState(false)
    const [productRequestOpen, setProductRequestOpen] = useState(false)
    const profileQuery = useSupplierProfile("supplier", true)
    const updateProfileMutation = useUpdateSupplierProfile()
    const profile = profileQuery.data

    if (profileQuery.isLoading) {
        return (
            <div className="flex min-h-[260px] items-center justify-center rounded-3xl border bg-white shadow-sm">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="rounded-3xl border bg-white p-8 text-sm text-red-600 shadow-sm">
                Tedarikçi profili bulunamadı.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            <Building2 className="h-3.5 w-3.5" />
                            Tedarikçi Profili
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{profile.name}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                                Firma ve iletişim bilgilerinizi bu alanda kontrol edebilirsiniz. Yapılan güncellemeler admin veya owner onayından sonra devreye alınır.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="gap-2" onClick={() => setProfileDialogOpen(true)}>
                            <Pencil className="h-4 w-4" />
                            Bilgileri Düzenle
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setCategoryRequestOpen(true)}>
                            Kategori Talebi
                        </Button>
                        <Button size="sm" onClick={() => setProductRequestOpen(true)}>
                            Ürün Talebi
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Yetkili</div>
                    <div className="mt-3 text-sm font-medium text-neutral-900">{profile.contactName || "-"}</div>
                </div>
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Telefon</div>
                    <div className="mt-3 text-sm font-medium text-neutral-900">{profile.phone || "-"}</div>
                </div>
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Vergi No</div>
                    <div className="mt-3 text-sm font-medium text-neutral-900">{profile.taxNumber || "-"}</div>
                </div>
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Varsayılan Vade</div>
                    <div className="mt-3 text-sm font-medium text-neutral-900">
                        {profile.defaultPaymentTermDays !== null && profile.defaultPaymentTermDays !== undefined
                            ? `${profile.defaultPaymentTermDays} gün`
                            : "-"}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Adres</div>
                <p className="mt-3 text-sm leading-7 text-neutral-700">
                    {profile.address?.trim() || "Henüz adres bilgisi eklenmemiş."}
                </p>
            </div>

            <EditSupplierProfileDialog
                open={profileDialogOpen}
                onOpenChange={setProfileDialogOpen}
                profile={profile}
                isPending={updateProfileMutation.isPending}
                onSubmit={async (values) => {
                    await updateProfileMutation.mutateAsync(values)
                }}
            />
            <CreateSupplierCategoryRequestDialog open={categoryRequestOpen} onOpenChange={setCategoryRequestOpen} />
            <CreateSupplierProductRequestDialog open={productRequestOpen} onOpenChange={setProductRequestOpen} />
        </div>
    )
}
