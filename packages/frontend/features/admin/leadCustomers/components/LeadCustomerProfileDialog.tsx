"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MapPin, Pencil, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CustomerAddressFormDialog } from "@/features/customerLocations/components/CustomerAddressFormDialog"
import { normalizeAddressPayload } from "@/features/customerLocations/lib/addressPayload"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import type { LeadCustomer } from "@/features/admin/leadCustomers/api/types"
import {
    useCreateLeadCustomer,
    useUpdateLeadCustomer,
} from "@/features/admin/leadCustomers/hooks/useLeadCustomers"
import { LeadCustomerUsageAreaPicker } from "./LeadCustomerUsageAreaPicker"
import {
    buildLeadCustomerPayload,
    createLeadCustomerFormDefaults,
    leadCustomerFormSchema,
    type LeadCustomerFormInput,
    type LeadCustomerFormValues,
} from "@/features/admin/leadCustomers/schema/leadCustomerForm"

const NONE_VALUE = "__none__"

type AttributeValueOption = {
    id: string
    name: string
    parentValueId?: string | null
    assets?: Array<{ type?: string; role?: string; url?: string }>
}


type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: LeadCustomer | null
    /** Yeni kayıt sonrası kartın listede görünür ve açık hale gelmesini sağlar. */
    onCreated?: (customerId: string) => void
}

export function LeadCustomerProfileDialog({ open, onOpenChange, customer, onCreated }: Props) {
    const isEditing = Boolean(customer)
    // Oluşturmada adres AYNI dialogda toplanır ve kayıtla birlikte gider.
    // Düzenlemede gösterilmez: mevcut adresler detay panelinden yönetiliyor.
    const [addressDraft, setAddressDraft] = useState<AddressDraftFormValues | null>(null)
    const [addressDialogOpen, setAddressDialogOpen] = useState(false)
    const attributesQuery = useAttributesForFilter()
    const createMutation = useCreateLeadCustomer()
    const updateMutation = useUpdateLeadCustomer(customer?.id ?? "")
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<LeadCustomerFormInput, unknown, LeadCustomerFormValues>({
        resolver: zodResolver(leadCustomerFormSchema),
        defaultValues: createLeadCustomerFormDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createLeadCustomerFormDefaults(customer))
    }, [customer, form, open])

    function handleProfileOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setAddressDraft(null)
            setAddressDialogOpen(false)
        }
        onOpenChange(nextOpen)
    }

    const selectedSectorValueId = useWatch({ control: form.control, name: "sectorValueId" })
    const selectedProductionGroupValueId = useWatch({
        control: form.control,
        name: "productionGroupValueId",
    })

    const valuesByCode = useMemo(() => {
        const read = (code: string): AttributeValueOption[] =>
            attributesQuery.data?.find((attribute) => attribute.code === code)?.values ?? []

        return {
            sector: read("sector"),
            productionGroup: read("production_group"),
            usageArea: read("usage_area"),
        }
    }, [attributesQuery.data])

    const productionGroupValues = useMemo(() => {
        if (!selectedSectorValueId) return valuesByCode.productionGroup
        return valuesByCode.productionGroup.filter(
            (value) => value.parentValueId === selectedSectorValueId,
        )
    }, [selectedSectorValueId, valuesByCode.productionGroup])

    // Sektör seçimi kullanım alanı listesini VARSAYILAN olarak daraltır ama
    // kilitlemez: picker kendi sektör filtresini formdaki seçimden başlatır,
    // kullanıcı "Tüm sektörler"e geçip farklı sektörlerden de seçebilir
    // (backend kısıtı 2026-08-11'de kaldırıldı).

    function toggleUsageArea(valueId: string) {
        const current = form.getValues("usageAreaValueIds") ?? []
        const next = current.includes(valueId)
            ? current.filter((id) => id !== valueId)
            : [...current, valueId]

        form.setValue("usageAreaValueIds", next, { shouldDirty: true })
    }

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildLeadCustomerPayload(values)

        try {
            if (customer) {
                await updateMutation.mutateAsync(payload)
            } else {
                // Adres girildiyse AYNI istekte gider; girilmediyse kullanıcı
                // daha sonra açık müşteri kartındaki "Adres Ekle" akışını kullanır.
                const created = await createMutation.mutateAsync({
                    ...payload,
                    ...(addressDraft ? { address: normalizeAddressPayload(addressDraft) } : {}),
                })
                onCreated?.(created.id)
            }

            handleProfileOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ı tarafından gösteriliyor;
            // dialog açık kalır ki kullanıcı girdisini kaybetmesin.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    return (
        <Dialog open={open} onOpenChange={handleProfileOpenChange}>
            <DialogContent className="max-h-[min(860px,calc(100vh-2rem))] w-[calc(100vw-2rem)] sm:max-w-[min(1120px,calc(100vw-3rem))] overflow-hidden rounded-3xl p-0">
                <DialogHeader className="border-b border-neutral-100 bg-linear-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-5 text-white sm:px-6">
                    <Badge variant="outline" className="w-fit border-white/15 bg-white/10 text-white">
                        Potansiyel Müşteri
                    </Badge>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                        {isEditing ? "Profili Düzenle" : "Yeni Potansiyel Müşteri"}
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                        Kullanım alanı ataması, müşterinin portalda göreceği &quot;İlgili Ürünler&quot; listesini belirler.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <ScrollArea className="max-h-[min(560px,calc(100vh-16rem))] px-5 py-4 sm:px-6">
                            <div className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Firma Adı *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Örn. Akdeniz Makine" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="websiteUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Web Sitesi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="acme.com" inputMode="url" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Yetkili Adı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ad Soyad" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefon *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0532 000 00 00" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    E-posta
                                                    <span className="ml-1 font-normal text-neutral-400">
                                                        (opsiyonel)
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        inputMode="email"
                                                        autoComplete="email"
                                                        placeholder="ornek@firma.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Not</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={3}
                                                    placeholder="Görüşme notu, ilgilendiği ürünler, kaynak..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-sm font-semibold text-neutral-950">
                                            Endüstriyel Profil
                                        </h3>
                                        <span className="text-xs text-neutral-400">
                                            ürün eşleşmesini belirler
                                        </span>
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3">
                                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                                            Birincil Sınıflandırma
                                        </p>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="sectorValueId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sektör</FormLabel>
                                                    <Select
                                                        value={field.value || NONE_VALUE}
                                                        onValueChange={(value) => {
                                                            const next = value === NONE_VALUE ? "" : value
                                                            field.onChange(next)
                                                            // Yalnız üretim grubu sıfırlanır (sektörün altında
                                                            // olmak zorunda). Kullanım alanları KORUNUR: farklı
                                                            // sektörlerden seçim meşrudur.
                                                            form.setValue("productionGroupValueId", "")
                                                        }}
                                                        disabled={attributesQuery.isLoading}
                                                    >
                                                        <FormControl>
                                                            {/* shadcn SelectTrigger varsayılanı `w-fit`;
                                                                ızgara sütununu doldurması için w-full. */}
                                                            <SelectTrigger className="h-10 w-full rounded-xl bg-white">
                                                                <SelectValue placeholder="Sektör seçin" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={NONE_VALUE}>Seçilmedi</SelectItem>
                                                            {valuesByCode.sector.map((value) => (
                                                                <SelectItem key={value.id} value={value.id}>
                                                                    {value.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="productionGroupValueId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Üretim Grubu</FormLabel>
                                                    <Select
                                                        value={field.value || NONE_VALUE}
                                                        onValueChange={(value) => {
                                                            const next = value === NONE_VALUE ? "" : value
                                                            field.onChange(next)
                                                        }}
                                                        disabled={attributesQuery.isLoading}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 w-full rounded-xl bg-white">
                                                                <SelectValue placeholder="Üretim grubu seçin" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={NONE_VALUE}>Seçilmedi</SelectItem>
                                                            {productionGroupValues.map((value) => (
                                                                <SelectItem key={value.id} value={value.id}>
                                                                    {value.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        </div>

                                        <p className="mt-2.5 text-[11px] leading-4 text-neutral-500">
                                            Üretim grubu, seçili sektörün altında olmalıdır. Kullanım alanları ise
                                            bundan bağımsızdır — farklı sektörlerden seçilebilir.
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="usageAreaValueIds"
                                        render={({ field }) => (
                                            <FormItem className="mt-4">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <FormLabel className="text-sm font-semibold text-neutral-950">
                                                        Kullanım Alanları
                                                    </FormLabel>
                                                    <span className="text-xs text-neutral-400">
                                                        müşterinin ilgilendiği alanlar
                                                    </span>
                                                </div>
                                                <FormControl>
                                                    <LeadCustomerUsageAreaPicker
                                                        usageAreaValues={valuesByCode.usageArea}
                                                        productionGroupValues={valuesByCode.productionGroup}
                                                        sectorValues={valuesByCode.sector}
                                                        focusSectorId={selectedSectorValueId}
                                                        focusProductionGroupId={selectedProductionGroupValueId}
                                                        selectedIds={field.value ?? []}
                                                        onToggle={toggleUsageArea}
                                                        onClear={() =>
                                                            form.setValue("usageAreaValueIds", [], {
                                                                shouldDirty: true,
                                                            })
                                                        }
                                                        isLoading={attributesQuery.isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {!isEditing ? (
                                    <div className="rounded-2xl border border-neutral-200 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                                                    <MapPin className="h-4 w-4 text-neutral-500" />
                                                    Adres
                                                    <Badge variant="outline" className="rounded-full font-normal">
                                                        Opsiyonel
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    Haritadan konum seçerek şimdi ekleyebilir ya da kayıttan
                                                    sonra düzenleyebilirsiniz.
                                                </p>
                                            </div>

                                            {!addressDraft ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-2xl"
                                                    onClick={() => setAddressDialogOpen(true)}
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                    Adres Ekle
                                                </Button>
                                            ) : null}
                                        </div>

                                        {addressDraft ? (
                                            <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                <div className="min-w-0 text-xs text-neutral-700">
                                                    <div className="font-medium text-neutral-900">
                                                        {addressDraft.label}
                                                    </div>
                                                    <div className="truncate">
                                                        {[addressDraft.line1, addressDraft.district, addressDraft.city]
                                                            .filter(Boolean)
                                                            .join(" · ")}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label="Adresi düzenle"
                                                        onClick={() => setAddressDialogOpen(true)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label="Adresi kaldır"
                                                        onClick={() => setAddressDraft(null)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </ScrollArea>

                        <DialogFooter className="border-t border-neutral-100 bg-white px-5 py-4 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => handleProfileOpenChange(false)}
                                disabled={isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {isPending ? "Kaydediliyor" : isEditing ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>

            {/*
              Adres dialogu API ÇAĞIRMAZ: taslağı yerel duruma alır, müşteri
              kaydıyla aynı istekte gider. Böylece "müşteri oluştu ama adres
              yazılamadı" gibi yarım durum oluşmaz.
            */}
            <CustomerAddressFormDialog
                open={addressDialogOpen}
                onOpenChange={setAddressDialogOpen}
                initialValues={addressDraft}
                defaultLabel="Merkez"
                defaultIsPrimary
                defaultIsShipping={false}
                title={addressDraft ? "Adresi Düzenle" : "Adres Ekle"}
                description="Haritadan konum seçin; adres müşteri kaydıyla birlikte oluşturulacak."
                submitLabel={addressDraft ? "Adresi Güncelle" : "Adresi Ekle"}
                onSubmit={(values) => {
                    setAddressDraft(values)
                    setAddressDialogOpen(false)
                }}
            />
        </Dialog>
    )
}
