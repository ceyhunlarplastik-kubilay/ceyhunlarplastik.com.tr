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
        () => users.filter((user) => user.groups.includes("sales") || user.groups.includes("admin") || user.groups.includes("owner")),
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
            })
            toast.success("Müşteri bilgileri güncellendi")
        } catch {
            toast.error("Müşteri bilgileri güncellenemedi")
        }
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
        </div>
    )
}
