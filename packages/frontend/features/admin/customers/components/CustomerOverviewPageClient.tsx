"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useCustomer } from "@/features/admin/customers/hooks/useCustomer"
import { useUpdateCustomer } from "@/features/admin/customers/hooks/useUpdateCustomer"
import { useConvertCustomer } from "@/features/admin/customers/hooks/useConvertCustomer"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { GeoAddressFields } from "@/features/geo/components/GeoAddressFields"

type AddressDraft = {
    label: string
    contactName: string
    phone: string
    email: string
    countryId: number | null
    stateId: number | null
    cityId: number | null
    country: string
    stateName: string
    city: string
    district: string
    line1: string
    line2: string
    postalCode: string
    taxOffice: string
    taxNumber: string
    isPrimary: boolean
    isBilling: boolean
    isShipping: boolean
    note: string
}

const emptyAddress = (): AddressDraft => ({
    label: "",
    contactName: "",
    phone: "",
    email: "",
    countryId: null,
    stateId: null,
    cityId: null,
    country: "Turkiye",
    stateName: "",
    city: "",
    district: "",
    line1: "",
    line2: "",
    postalCode: "",
    taxOffice: "",
    taxNumber: "",
    isPrimary: false,
    isBilling: false,
    isShipping: true,
    note: "",
})

type Props = {
    customerId: string
}

export function CustomerOverviewPageClient({ customerId }: Props) {
    const customerQuery = useCustomer(customerId)
    const updateMutation = useUpdateCustomer()
    const convertMutation = useConvertCustomer()
    const attrsQuery = useAttributesForFilter()
    const usersQuery = useUsers({ params: { page: 1, limit: 500 } })

    const customer = customerQuery.data
    const [draft, setDraft] = useState({
        companyName: "",
        fullName: "",
        phone: "",
        email: "",
        note: "",
        status: "LEAD" as "LEAD" | "CUSTOMER",
        assignedSalesUserId: "",
        sectorValueId: "",
        productionGroupValueId: "",
        usageAreaValueId: "",
        addresses: [] as AddressDraft[],
    })

    useEffect(() => {
        if (!customer) return
        setDraft({
            companyName: customer.companyName ?? "",
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            note: customer.note ?? "",
            status: customer.status,
            assignedSalesUserId: customer.assignedSalesUserId ?? "",
            sectorValueId: customer.sectorValueId ?? "",
            productionGroupValueId: customer.productionGroupValueId ?? "",
            usageAreaValueId: customer.usageAreaValues?.[0]?.id ?? "",
            addresses: (customer.addresses ?? []).map((address) => ({
                label: address.label,
                contactName: address.contactName ?? "",
                phone: address.phone ?? "",
                email: address.email ?? "",
                countryId: address.countryId ?? null,
                stateId: address.stateId ?? null,
                cityId: address.cityId ?? null,
                country: address.country,
                stateName: address.stateRef?.name ?? "",
                city: address.city,
                district: address.district ?? "",
                line1: address.line1,
                line2: address.line2 ?? "",
                postalCode: address.postalCode ?? "",
                taxOffice: address.taxOffice ?? "",
                taxNumber: address.taxNumber ?? "",
                isPrimary: address.isPrimary,
                isBilling: address.isBilling,
                isShipping: address.isShipping,
                note: address.note ?? "",
            })),
        })
    }, [customer])

    const attributes = attrsQuery.data ?? []
    const users = usersQuery.data?.data ?? []

    const sectorValues = useMemo(
        () => attributes.find((attribute) => attribute.code === "sector")?.values ?? [],
        [attributes],
    )
    const productionGroupValues = useMemo(() => {
        const all = attributes.find((attribute) => attribute.code === "production_group")?.values ?? []
        if (!draft.sectorValueId) return all
        return all.filter((value) => value.parentValueId === draft.sectorValueId)
    }, [attributes, draft.sectorValueId])
    const usageAreaValues = useMemo(() => {
        const all = attributes.find((attribute) => attribute.code === "usage_area")?.values ?? []
        if (!draft.productionGroupValueId) return all
        return all.filter((value) => value.parentValueId === draft.productionGroupValueId)
    }, [attributes, draft.productionGroupValueId])
    const salesUsers = useMemo(
        () => users.filter((user) => user.groups.includes("sales") || user.groups.includes("sales_director") || user.groups.includes("admin") || user.groups.includes("owner")),
        [users],
    )

    async function handleSave() {
        if (!customer) return

        try {
            await updateMutation.mutateAsync({
                id: customer.id,
                companyName: draft.companyName || null,
                fullName: draft.fullName,
                phone: draft.phone,
                email: draft.email,
                note: draft.note || null,
                status: draft.status,
                assignedSalesUserId: draft.assignedSalesUserId || null,
                sectorValueId: draft.sectorValueId || null,
                productionGroupValueId: draft.productionGroupValueId || null,
                usageAreaValueIds: draft.usageAreaValueId ? [draft.usageAreaValueId] : [],
                addresses: draft.addresses
                    .filter((address) => address.label.trim() && address.city.trim() && address.line1.trim())
                    .map((address, index) => ({
                        label: address.label.trim(),
                        contactName: address.contactName.trim() || null,
                        phone: address.phone.trim() || null,
                        email: address.email.trim() || null,
                        countryId: address.countryId ?? null,
                        stateId: address.stateId ?? null,
                        cityId: address.cityId ?? null,
                        country: address.country.trim() || "Turkiye",
                        city: address.city.trim(),
                        district: address.district.trim() || null,
                        line1: address.line1.trim(),
                        line2: address.line2.trim() || null,
                        postalCode: address.postalCode.trim() || null,
                        taxOffice: address.taxOffice.trim() || null,
                        taxNumber: address.taxNumber.trim() || null,
                        isPrimary: address.isPrimary || index === 0,
                        isBilling: address.isBilling,
                        isShipping: address.isShipping,
                        note: address.note.trim() || null,
                    })),
            })
            toast.success("Müşteri bilgileri güncellendi")
        } catch {
            toast.error("Müşteri bilgileri güncellenemedi")
        }
    }

    function updateAddress(index: number, patch: Partial<AddressDraft>) {
        setDraft((prev) => ({
            ...prev,
            addresses: prev.addresses.map((address, currentIndex) =>
                currentIndex === index ? { ...address, ...patch } : address,
            ),
        }))
    }

    function removeAddress(index: number) {
        setDraft((prev) => ({
            ...prev,
            addresses: prev.addresses.filter((_, currentIndex) => currentIndex !== index),
        }))
    }

    function addAddress() {
        setDraft((prev) => ({
            ...prev,
            addresses: [...prev.addresses, emptyAddress()],
        }))
    }

    async function handleConvert() {
        if (!customer) return
        try {
            await convertMutation.mutateAsync(customer.id)
            toast.success("Potansiyel müşteri aktif müşteriye çevrildi")
        } catch {
            toast.error("Dönüştürme işlemi başarısız oldu")
        }
    }

    if (customerQuery.isLoading) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border bg-white shadow-sm">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="rounded-3xl border bg-white p-8 text-sm text-red-600 shadow-sm">
                Müşteri kaydı bulunamadı.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-950">Genel Bilgiler</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            İletişim, sektör eşleşmesi ve satış sorumlusu bilgisini yönetin.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {customer.status === "LEAD" ? (
                            <Button variant="outline" onClick={handleConvert} disabled={convertMutation.isPending}>
                                Potansiyeli Müşteriye Çevir
                            </Button>
                        ) : null}
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Firma Adı</Label>
                        <Input id="companyName" value={draft.companyName} onChange={(e) => setDraft((prev) => ({ ...prev, companyName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Yetkili Kişi</Label>
                        <Input id="fullName" value={draft.fullName} onChange={(e) => setDraft((prev) => ({ ...prev, fullName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" value={draft.phone} onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" type="email" value={draft.email} onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Durum</Label>
                        <Select value={draft.status} onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value as "LEAD" | "CUSTOMER" }))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LEAD">Potansiyel Müşteri</SelectItem>
                                <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Satış Temsilcisi</Label>
                        <Select value={draft.assignedSalesUserId || "__none__"} onValueChange={(value) => setDraft((prev) => ({ ...prev, assignedSalesUserId: value === "__none__" ? "" : value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Atama yok" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Atama yok</SelectItem>
                                {salesUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.identifier}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Sektör</Label>
                        <Select value={draft.sectorValueId || "__none__"} onValueChange={(value) => setDraft((prev) => ({ ...prev, sectorValueId: value === "__none__" ? "" : value, productionGroupValueId: "", usageAreaValueId: "" }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seçilmedi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Seçilmedi</SelectItem>
                                {sectorValues.map((value) => (
                                    <SelectItem key={value.id} value={value.id}>{value.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Üretim Grubu</Label>
                        <Select value={draft.productionGroupValueId || "__none__"} onValueChange={(value) => setDraft((prev) => ({ ...prev, productionGroupValueId: value === "__none__" ? "" : value, usageAreaValueId: "" }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seçilmedi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Seçilmedi</SelectItem>
                                {productionGroupValues.map((value) => (
                                    <SelectItem key={value.id} value={value.id}>{value.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Kullanım Alanı</Label>
                        <Select value={draft.usageAreaValueId || "__none__"} onValueChange={(value) => setDraft((prev) => ({ ...prev, usageAreaValueId: value === "__none__" ? "" : value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seçilmedi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Seçilmedi</SelectItem>
                                {usageAreaValues.map((value) => (
                                    <SelectItem key={value.id} value={value.id}>{value.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="note">Not</Label>
                        <Textarea id="note" value={draft.note} onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))} rows={5} />
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-950">Adresler</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            Fatura, sevkiyat ve operasyon iletişimi için profesyonel adres kayıtlarını yönetin.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={addAddress}>
                        Adres Ekle
                    </Button>
                </div>

                {draft.addresses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
                        Henüz tanımlı adres bulunmuyor.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {draft.addresses.map((address, index) => (
                            <div key={`address-${index}`} className="rounded-2xl border border-neutral-200 p-4">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-neutral-900">
                                        {address.label.trim() || `Adres ${index + 1}`}
                                    </div>
                                    <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => removeAddress(index)}>
                                        Kaldır
                                    </Button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Adres Etiketi</Label>
                                        <Input value={address.label} onChange={(e) => updateAddress(index, { label: e.target.value })} placeholder="Merkez, Depo, Fatura..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>İrtibat Kişisi</Label>
                                        <Input value={address.contactName} onChange={(e) => updateAddress(index, { contactName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefon</Label>
                                        <Input value={address.phone} onChange={(e) => updateAddress(index, { phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>E-posta</Label>
                                        <Input type="email" value={address.email} onChange={(e) => updateAddress(index, { email: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2 xl:col-span-3 grid gap-4 xl:grid-cols-3">
                                        <GeoAddressFields
                                            countryId={address.countryId}
                                            stateId={address.stateId}
                                            cityId={address.cityId}
                                            onChange={(patch) => updateAddress(index, patch)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mahalle / Bölge</Label>
                                        <Input value={address.district} onChange={(e) => updateAddress(index, { district: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Posta Kodu</Label>
                                        <Input value={address.postalCode} onChange={(e) => updateAddress(index, { postalCode: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Vergi Dairesi</Label>
                                        <Input value={address.taxOffice} onChange={(e) => updateAddress(index, { taxOffice: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Vergi Numarası</Label>
                                        <Input value={address.taxNumber} onChange={(e) => updateAddress(index, { taxNumber: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                        <Label>Adres Satırı 1</Label>
                                        <Input value={address.line1} onChange={(e) => updateAddress(index, { line1: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                        <Label>Adres Satırı 2</Label>
                                        <Input value={address.line2} onChange={(e) => updateAddress(index, { line2: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                        <Label>Adres Notu</Label>
                                        <Textarea value={address.note} onChange={(e) => updateAddress(index, { note: e.target.value })} rows={3} />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={address.isPrimary}
                                            onChange={(e) => updateAddress(index, { isPrimary: e.target.checked })}
                                        />
                                        Birincil adres
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={address.isBilling}
                                            onChange={(e) => updateAddress(index, { isBilling: e.target.checked })}
                                        />
                                        Fatura adresi
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={address.isShipping}
                                            onChange={(e) => updateAddress(index, { isShipping: e.target.checked })}
                                        />
                                        Sevkiyat adresi
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
