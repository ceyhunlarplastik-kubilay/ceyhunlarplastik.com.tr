"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, useReducedMotion } from "motion/react"
import { Building2, Loader2, MapPin, Pencil, Phone, Save, Shapes, Trash2 } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import { CustomerAddressFormDialog } from "@/features/customerLocations/components/CustomerAddressFormDialog"
import { normalizeAddressPayload } from "@/features/customerLocations/lib/addressPayload"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { DialogFormSection, OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { LeadCustomer } from "@/features/admin/leadCustomers/api/types"
import {
    useCreateLeadCustomer,
    useUpdateLeadCustomer,
} from "@/features/admin/leadCustomers/hooks/useLeadCustomers"
import { LeadCustomerUsageAreaPicker } from "./LeadCustomerUsageAreaPicker"
import { CustomerPhonesField } from "@/features/customerPhones/components/CustomerPhonesField"
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

/**
 * Veri girişi panelinin potansiyel müşteri formu (oluşturma + düzenleme).
 * Yerleşim admin/temsilci dialoguyla (`EditCustomerProfileDialog`) AYNI kalıpta:
 * sabit başlık, ekran yüksekliğini kullanan kayan gövde, sabit eylem çubuğu ve
 * `DialogFormSection` bölümleri. Ticari alanlar bu yüzeyde bilinçli olarak yok.
 */
export function LeadCustomerProfileDialog({ open, onOpenChange, customer, onCreated }: Props) {
    const isEditing = Boolean(customer)
    const shouldReduceMotion = useReducedMotion()
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
            {/*
              Admin dialoguyla aynı ölçüler: yükseklik ekrana sınırlı (`dvh`, mobil
              tarayıcı çubuklarını hesaba katar), yalnız gövde kayar. Eski gövde
              ekran ne olursa olsun 560px'e sabitti ve dialog 1120px genişlikteydi.
            */}
            <DialogContent className="flex max-h-[min(60rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(64rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b border-neutral-100 px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="text-lg font-semibold tracking-tight">
                            {isEditing ? "Potansiyel Müşteriyi Düzenle" : "Yeni Potansiyel Müşteri"}
                        </DialogTitle>
                        <Badge variant="secondary" className="rounded-full">
                            Potansiyel Müşteri
                        </Badge>
                    </div>
                    <DialogDescription className="line-clamp-2">
                        {customer ? (
                            <span className="font-medium text-neutral-700">
                                {resolveCustomerDisplayName(customer)}
                                {" · "}
                            </span>
                        ) : null}
                        Firma bilgileri, iletişim ve endüstriyel profil.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        {/* Düz `overflow-y-auto` gövde: seçicinin yapışkan araç çubuğu bu
                            scroll'a tutunur (bkz. LeadCustomerUsageAreaPicker `overflow-clip`). */}
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <motion.div
                                key={customer?.id ?? "lead-customer-new"}
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                                className="divide-y divide-neutral-100 px-4 sm:px-6"
                            >
                                <DialogFormSection
                                    icon={<Building2 />}
                                    title="Firma Bilgileri"
                                    description="Firma adı zorunlu; yetkili kişi sonradan da eklenebilir."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
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
                                            name="fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Yetkili Adı
                                                        <OptionalFieldHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ad Soyad" autoComplete="off" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="note"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
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
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Phone />}
                                    title="İletişim"
                                    description="Birincil numara aramada ve listelerde kullanılır; muhasebe, satın alma gibi ek hatları etiketiyle ekleyin."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        E-posta
                                                        <OptionalFieldHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            inputMode="email"
                                                            autoComplete="off"
                                                            placeholder="ornek@firma.com"
                                                            {...field}
                                                        />
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
                                                    <FormLabel>
                                                        Web Sitesi
                                                        <OptionalFieldHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="acme.com" inputMode="url" autoComplete="off" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Admin/temsilci dialoguyla ORTAK: birincil + etiketli ek numaralar. */}
                                    <CustomerPhonesField />
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Shapes />}
                                    tone="brand"
                                    title="Endüstriyel Profil"
                                    description="Sektör ve üretim grubu birincil sınıflandırmadır. Kullanım alanları farklı sektörlerden seçilebilir ve müşterinin portalda göreceği ilgili ürünleri belirler."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
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
                                                            {/* shadcn SelectTrigger varsayılanı `w-fit`. */}
                                                            <SelectTrigger className="w-full">
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
                                                            <SelectTrigger className="w-full">
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

                                    <FormField
                                        control={form.control}
                                        name="usageAreaValueIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kullanım Alanları</FormLabel>
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
                                </DialogFormSection>

                                {!isEditing ? (
                                    <DialogFormSection
                                        icon={<MapPin />}
                                        title="Adres"
                                        description="Haritadan konum seçerek şimdi ekleyebilir ya da kayıttan sonra müşteri kartından ekleyebilirsiniz."
                                        aside={
                                            <Badge variant="outline" className="rounded-full font-normal">
                                                Opsiyonel
                                            </Badge>
                                        }
                                    >
                                        {addressDraft ? (
                                            <div className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
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
                                                <div className="flex shrink-0 items-center gap-1">
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
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="rounded-2xl"
                                                onClick={() => setAddressDialogOpen(true)}
                                            >
                                                <MapPin className="h-4 w-4" />
                                                Adres Ekle
                                            </Button>
                                        )}
                                    </DialogFormSection>
                                ) : null}
                            </motion.div>
                        </div>

                        <DialogFooter className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3 sm:px-6">
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
