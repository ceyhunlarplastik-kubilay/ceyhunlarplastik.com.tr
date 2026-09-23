"use client"

import { useEffect, useId, useMemo, type ComponentProps, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { motion, useReducedMotion } from "motion/react"
import {
    BadgePercent,
    Building2,
    CalendarClock,
    Check,
    CreditCard,
    Headset,
    Loader2,
    ReceiptText,
    Save,
    Shapes,
    SlidersHorizontal,
} from "lucide-react"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import type { CompanyContact } from "@/features/admin/companyContacts/api/types"
import { LeadCustomerUsageAreaPicker } from "@/features/admin/leadCustomers/components/LeadCustomerUsageAreaPicker"
import {
    createCustomerEditorDefaults,
    customerEditorSchema,
    type CustomerEditorFormInput,
    type CustomerEditorFormValues,
} from "@/features/admin/customers/schema/customerEditor"

type SelectOption = {
    id: string
    label: string
}

type FilterValueOption = {
    id: string
    name: string
    parentValueId?: string | null
    /** Kullanım alanı seçicisindeki küçük görsel; yoksa yer tutucu ikon gösterilir. */
    assets?: Array<{ type?: string; role?: string; url?: string }>
}

type CustomerAssignableAttribute = {
    id: string
    code: string
    name: string
    values?: FilterValueOption[]
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: AdminCustomer | null
    salesUsers: SelectOption[]
    sectorValues: FilterValueOption[]
    allProductionGroupValues: FilterValueOption[]
    allUsageAreaValues: FilterValueOption[]
    customerAssignableAttributes: CustomerAssignableAttribute[]
    companyContacts: CompanyContact[]
    onSubmit: (values: CustomerEditorFormValues, customer: AdminCustomer) => Promise<void>
    isPending?: boolean
}

const NONE_VALUE = "__none__"
const HIERARCHY_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

const STATUS_LABELS: Record<AdminCustomer["status"], string> = {
    LEAD: "Potansiyel Müşteri",
    CUSTOMER: "Cari Müşteri",
}

const SECTION_TONES = {
    neutral: "bg-neutral-100 text-neutral-600",
    brand: "bg-brand/10 text-brand",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
} as const

/**
 * Bölümler iç içe kart DEĞİL, düz bloklar: dialog gövdesi zaten kendi dolgusuna
 * sahip; eski renkli kutular mobilde iki kat yatay dolgu harcıyordu. Renk dili
 * başlık ikonunda korunuyor.
 */
function FormSection({
    icon,
    title,
    description,
    tone = "neutral",
    aside,
    children,
}: {
    icon: ReactNode
    title: string
    description?: string
    tone?: keyof typeof SECTION_TONES
    aside?: ReactNode
    children: ReactNode
}) {
    const headingId = useId()

    return (
        <section aria-labelledby={headingId} className="space-y-4 py-5 sm:py-6">
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-xl [&_svg]:size-4",
                        SECTION_TONES[tone],
                    )}
                >
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 id={headingId} className="text-sm font-semibold text-neutral-950">
                        {title}
                    </h3>
                    {description ? (
                        <p className="mt-0.5 text-xs leading-5 text-neutral-500">{description}</p>
                    ) : null}
                </div>
                {aside ? <div className="shrink-0 pt-1.5">{aside}</div> : null}
            </div>
            {children}
        </section>
    )
}

function OptionalHint() {
    return <span className="font-normal text-neutral-400">(opsiyonel)</span>
}

function SelectedCount({ count }: { count: number }) {
    return <span className="text-xs font-medium text-neutral-500">{count} seçili</span>
}

/**
 * `name`/`ref`/`onBlur` da iletilir ki RHF geçersiz kayıtta bu alana
 * odaklanabilsin — kayan gövdede hatalı alan görünür alana gelir.
 */
function NumericInputField({
    value,
    onChange,
    ...inputProps
}: Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
    value: number | null
    onChange: (value: number | null) => void
}) {
    return (
        <Input
            {...inputProps}
            type="number"
            value={value ?? ""}
            onChange={(event) => {
                const nextValue = event.target.value
                onChange(nextValue === "" ? null : Number(nextValue))
            }}
        />
    )
}

export function EditCustomerProfileDialog({
    open,
    onOpenChange,
    customer,
    salesUsers,
    sectorValues,
    allProductionGroupValues,
    allUsageAreaValues,
    customerAssignableAttributes,
    companyContacts,
    onSubmit,
    isPending = false,
}: Props) {
    const shouldReduceMotion = useReducedMotion()
    const form = useForm<CustomerEditorFormInput, unknown, CustomerEditorFormValues>({
        resolver: zodResolver(customerEditorSchema),
        defaultValues: createCustomerEditorDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createCustomerEditorDefaults(customer))
    }, [customer, form, open])

    const selectedSectorValueId = useWatch({
        control: form.control,
        name: "sectorValueId",
    })
    const selectedProductionGroupValueId = useWatch({
        control: form.control,
        name: "productionGroupValueId",
    })
    const selectedGenericAttributeValueIds = useWatch({
        control: form.control,
        name: "attributeValueIds",
    })
    const selectedCompanyContactAssignments = useWatch({
        control: form.control,
        name: "companyContactAssignments",
    })

    // Üretim grubu seçili sektörün ALTINDA olmak zorunda (backend de doğruluyor).
    // Kullanım alanları ise bundan bağımsız: seçici sektöre göre yalnız
    // VARSAYILAN olarak daraltır, kilitlemez.
    const productionGroupValues = useMemo(() => {
        if (!selectedSectorValueId) return allProductionGroupValues
        return allProductionGroupValues.filter((value) => value.parentValueId === selectedSectorValueId)
    }, [allProductionGroupValues, selectedSectorValueId])

    const genericCustomerAttributes = useMemo(
        () => customerAssignableAttributes.filter((attribute) => !HIERARCHY_ATTRIBUTE_CODES.has(attribute.code)),
        [customerAssignableAttributes],
    )

    function toggleMultiValue(fieldName: "attributeValueIds" | "usageAreaValueIds", valueId: string) {
        const current = form.getValues(fieldName) ?? []
        const next = current.includes(valueId)
            ? current.filter((item) => item !== valueId)
            : [...current, valueId]

        form.setValue(fieldName, next, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        })
    }

    function toggleCompanyContact(companyContactId: string) {
        const current = form.getValues("companyContactAssignments") ?? []
        const exists = current.some((assignment) => assignment.companyContactId === companyContactId)
        const next = exists
            ? current.filter((assignment) => assignment.companyContactId !== companyContactId)
            : [
                ...current,
                {
                    companyContactId,
                    isActive: true,
                    displayOrder: current.length,
                    note: null,
                },
            ]

        form.setValue("companyContactAssignments", next.map((assignment, index) => ({
            ...assignment,
            displayOrder: index,
        })), {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        })
    }

    const handleSubmit = form.handleSubmit(async (values) => {
        if (!customer) return

        try {
            await onSubmit(values, customer)
            onOpenChange(false)
        } catch {
            // Hata bildirimi çağıranda (toast). Dialog açık kalır ki kullanıcı
            // girdisini kaybetmesin; yakalanmazsa RHF hatayı yeniden fırlatıp
            // konsola "Uncaught (in promise)" düşürüyordu.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    // Yalnız LİSTEDE görünen kişiler sayılır: listede olmayan (ör. pasif) bir
    // kişiye ait atama sayacı şişirip ekranda karşılığı olmayan bir "seçili" gösterirdi.
    const selectedCompanyContactCount = useMemo(() => {
        const selectedIds = new Set(
            (selectedCompanyContactAssignments ?? []).map((assignment) => assignment.companyContactId),
        )
        return companyContacts.filter((contact) => selectedIds.has(contact.id)).length
    }, [companyContacts, selectedCompanyContactAssignments])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/*
              Yükseklik ekrana sınırlı; başlık ve eylem çubuğu sabit, yalnız gövde
              kayar. Mobil genişlik primitive'in `max-w-[calc(100%-2rem)]`'sinden
              gelir — `sm:` önekli sınır onu EZMEZ (öneksiz `max-w-4xl` eziyordu ve
              dialog telefonda ekran kenarına yapışıyordu).
            */}
            <DialogContent className="flex max-h-[min(60rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(64rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b border-neutral-100 px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="text-lg font-semibold tracking-tight">
                            Müşteri Bilgilerini Düzenle
                        </DialogTitle>
                        {customer ? (
                            <Badge
                                variant={customer.status === "CUSTOMER" ? "default" : "secondary"}
                                className="rounded-full"
                            >
                                {STATUS_LABELS[customer.status]}
                            </Badge>
                        ) : null}
                    </div>
                    <DialogDescription className="line-clamp-2">
                        {customer ? (
                            <span className="font-medium text-neutral-700">
                                {resolveCustomerDisplayName(customer)}
                                {" · "}
                            </span>
                        ) : null}
                        Temel bilgiler, endüstriyel profil ve ticari şartlar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <motion.div
                                key={customer?.id ?? "customer-editor"}
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                                className="divide-y divide-neutral-100 px-4 sm:px-6"
                            >
                                <FormSection
                                    icon={<Building2 />}
                                    title="Genel Bilgiler"
                                    description="Firma kimliği, iletişim bilgileri ve müşteri temsilcisi ataması."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Firma Adı</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Örn. Akdeniz Makine" />
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
                                                        Yetkili Kişi
                                                        <OptionalHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Ad Soyad" autoComplete="off" />
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
                                                        <Input
                                                            {...field}
                                                            type="tel"
                                                            inputMode="tel"
                                                            autoComplete="off"
                                                            placeholder="0532 000 00 00"
                                                        />
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
                                                        <OptionalHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                            inputMode="email"
                                                            autoComplete="off"
                                                            placeholder="ornek@firma.com"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Durum</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            {/* shadcn SelectTrigger varsayılanı `w-fit`. */}
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="LEAD">{STATUS_LABELS.LEAD}</SelectItem>
                                                            <SelectItem value="CUSTOMER">{STATUS_LABELS.CUSTOMER}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="assignedSalesUserId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Müşteri Temsilcisi</FormLabel>
                                                    <Select
                                                        value={field.value || NONE_VALUE}
                                                        onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Atama yok" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={NONE_VALUE}>Atama yok</SelectItem>
                                                            {salesUsers.map((user) => (
                                                                <SelectItem key={user.id} value={user.id}>
                                                                    {user.label}
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
                                            name="note"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
                                                    <FormLabel>Not</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} rows={3} placeholder="İç iletişim notu" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </FormSection>

                                <FormSection
                                    icon={<Shapes />}
                                    tone="brand"
                                    title="Endüstriyel Profil"
                                    description="Sektör ve üretim grubu birincil sınıflandırmadır. Kullanım alanları farklı sektörlerden seçilebilir ve portaldaki ilgili ürünleri belirler."
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
                                                            field.onChange(value === NONE_VALUE ? "" : value)
                                                            // Yalnız üretim grubu sıfırlanır (sektörün altında
                                                            // olmak zorunda). Kullanım alanları KORUNUR: farklı
                                                            // sektörlerden seçim meşrudur — eskiden burada
                                                            // hepsi sessizce siliniyordu.
                                                            form.setValue("productionGroupValueId", "", { shouldDirty: true })
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Seçilmedi" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={NONE_VALUE}>Seçilmedi</SelectItem>
                                                            {sectorValues.map((value) => (
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
                                                        onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Seçilmedi" />
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
                                                    {/* Veri girişi dialoguyla AYNI seçici: arama, sektör
                                                        filtresi ve her zaman görünen "seçilenler" çubuğu. */}
                                                    <LeadCustomerUsageAreaPicker
                                                        usageAreaValues={allUsageAreaValues}
                                                        productionGroupValues={allProductionGroupValues}
                                                        sectorValues={sectorValues}
                                                        focusSectorId={selectedSectorValueId}
                                                        focusProductionGroupId={selectedProductionGroupValueId}
                                                        selectedIds={field.value ?? []}
                                                        onToggle={(valueId) => toggleMultiValue("usageAreaValueIds", valueId)}
                                                        onClear={() =>
                                                            form.setValue("usageAreaValueIds", [], {
                                                                shouldDirty: true,
                                                                shouldTouch: true,
                                                                shouldValidate: true,
                                                            })
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </FormSection>

                                {genericCustomerAttributes.length > 0 ? (
                                    <FormSection
                                        icon={<SlidersHorizontal />}
                                        tone="sky"
                                        title="Profil Eşleşme Alanları"
                                        description="Müşteri profiline atanabilen diğer özellikler."
                                    >
                                        <div className="space-y-5">
                                            {genericCustomerAttributes.map((attribute) => (
                                                <div key={attribute.id} className="space-y-2">
                                                    <div className="text-sm font-medium text-neutral-900">{attribute.name}</div>
                                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                        {(attribute.values ?? []).map((value) => {
                                                            const isSelected = (selectedGenericAttributeValueIds ?? []).includes(value.id)

                                                            return (
                                                                <button
                                                                    key={value.id}
                                                                    type="button"
                                                                    aria-pressed={isSelected}
                                                                    onClick={() => toggleMultiValue("attributeValueIds", value.id)}
                                                                    className={cn(
                                                                        "flex min-h-10 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start text-sm transition",
                                                                        isSelected
                                                                            ? "border-sky-400 bg-sky-50/60 text-neutral-950 shadow-sm"
                                                                            : "border-neutral-200 bg-white text-neutral-600 hover:border-sky-200",
                                                                    )}
                                                                >
                                                                    <span className="min-w-0">{value.name}</span>
                                                                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-sky-600" /> : null}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </FormSection>
                                ) : null}

                                <FormSection
                                    icon={<Headset />}
                                    tone="emerald"
                                    title="Ceyhunlar İletişimleri"
                                    description="Bu müşterinin portalında görünecek Ceyhunlar departman iletişim kişileri."
                                    aside={companyContacts.length > 0 ? <SelectedCount count={selectedCompanyContactCount} /> : null}
                                >
                                    {companyContacts.length > 0 ? (
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {companyContacts.map((contact) => {
                                                const isSelected = (selectedCompanyContactAssignments ?? [])
                                                    .some((assignment) => assignment.companyContactId === contact.id)

                                                return (
                                                    <button
                                                        key={contact.id}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        onClick={() => toggleCompanyContact(contact.id)}
                                                        className={cn(
                                                            "flex items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-start text-sm transition",
                                                            isSelected
                                                                ? "border-emerald-300 bg-emerald-50/50 text-neutral-950 shadow-sm"
                                                                : "border-neutral-200 bg-white text-neutral-600 hover:border-emerald-200",
                                                        )}
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block font-medium">{contact.department}</span>
                                                            <span className="mt-1 block text-xs text-neutral-500">
                                                                {contact.name}
                                                                {contact.roleLabel ? ` · ${contact.roleLabel}` : ""}
                                                            </span>
                                                            <span className="mt-1 block truncate text-xs text-neutral-400">
                                                                {[contact.email, contact.phone || contact.whatsappPhone].filter(Boolean).join(" · ") || "İletişim kanalı yok"}
                                                            </span>
                                                        </span>
                                                        {/* Seçilmemişken de görünen kutu: kartın seçilebilir olduğu anlaşılsın. */}
                                                        <span
                                                            className={cn(
                                                                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition",
                                                                isSelected
                                                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                                                    : "border-neutral-300 bg-white text-transparent",
                                                            )}
                                                        >
                                                            <Check className="size-3" />
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-sm text-neutral-500">
                                            Henüz Ceyhunlar iletişim kaydı yok. Önce admin panelinden departman iletişimi oluşturun.
                                        </div>
                                    )}
                                </FormSection>

                                <FormSection
                                    icon={<BadgePercent />}
                                    tone="amber"
                                    title="Ticari Şartlar"
                                    description="İskonto, vade ve kredi limiti fiyat ve sipariş akışlarında kullanılır."
                                >
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="generalDiscountPercent"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        <BadgePercent className="h-4 w-4 text-neutral-400" />
                                                        Genel İskonto (%)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <NumericInputField
                                                            name={field.name}
                                                            ref={field.ref}
                                                            onBlur={field.onBlur}
                                                            value={(field.value ?? null) as number | null}
                                                            onChange={field.onChange}
                                                            placeholder="örn. 12.5"
                                                            inputMode="decimal"
                                                            min={0}
                                                            step="0.01"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="defaultPaymentTermDays"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        <CalendarClock className="h-4 w-4 text-neutral-400" />
                                                        Varsayılan Vade (Gün)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <NumericInputField
                                                            name={field.name}
                                                            ref={field.ref}
                                                            onBlur={field.onBlur}
                                                            value={(field.value ?? null) as number | null}
                                                            onChange={field.onChange}
                                                            placeholder="örn. 30"
                                                            inputMode="numeric"
                                                            min={0}
                                                            step="1"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="creditLimit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        <CreditCard className="h-4 w-4 text-neutral-400" />
                                                        Kredi Limiti
                                                    </FormLabel>
                                                    <FormControl>
                                                        <NumericInputField
                                                            name={field.name}
                                                            ref={field.ref}
                                                            onBlur={field.onBlur}
                                                            value={(field.value ?? null) as number | null}
                                                            onChange={field.onChange}
                                                            placeholder="örn. 250000"
                                                            inputMode="decimal"
                                                            min={0}
                                                            step="0.01"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paymentTermNote"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-3">
                                                    <FormLabel>
                                                        <ReceiptText className="h-4 w-4 text-neutral-400" />
                                                        Ödeme Şartı Notu
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            rows={3}
                                                            placeholder="Örn. ay sonu kapama, mutabakat sonrası ödeme, çek/hesap şartı"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </FormSection>
                            </motion.div>
                        </div>

                        <DialogFooter className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={!customer || isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isPending ? "Kaydediliyor..." : "Müşteriyi Güncelle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
