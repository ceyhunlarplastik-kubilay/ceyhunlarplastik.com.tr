"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { motion, AnimatePresence } from "motion/react"
import { BadgePercent, Building2, CalendarClock, Check, CreditCard, Mail, Phone, ReceiptText, Shapes, UserRound } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import type { CompanyContact } from "@/features/admin/companyContacts/api/types"
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

function NumericInputField({
    value,
    onChange,
    placeholder,
    min,
    step,
}: {
    value: number | null
    onChange: (value: number | null) => void
    placeholder: string
    min?: number
    step?: string
}) {
    return (
        <Input
            type="number"
            min={min}
            step={step}
            value={value ?? ""}
            onChange={(event) => {
                const nextValue = event.target.value
                onChange(nextValue === "" ? null : Number(nextValue))
            }}
            placeholder={placeholder}
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

    const productionGroupValues = useMemo(() => {
        if (!selectedSectorValueId) return allProductionGroupValues
        return allProductionGroupValues.filter((value) => value.parentValueId === selectedSectorValueId)
    }, [allProductionGroupValues, selectedSectorValueId])

    const usageAreaValues = useMemo(() => {
        if (selectedProductionGroupValueId) {
            return allUsageAreaValues.filter((value) => value.parentValueId === selectedProductionGroupValueId)
        }

        if (selectedSectorValueId) {
            const allowedProductionIds = new Set(
                allProductionGroupValues
                    .filter((value) => value.parentValueId === selectedSectorValueId)
                    .map((value) => value.id),
            )

            return allUsageAreaValues.filter((value) => value.parentValueId ? allowedProductionIds.has(value.parentValueId) : false)
        }

        return allUsageAreaValues
    }, [allProductionGroupValues, allUsageAreaValues, selectedProductionGroupValueId, selectedSectorValueId])

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Müşteri Bilgilerini Düzenle</DialogTitle>
                    <DialogDescription>
                        Temel müşteri bilgilerini ve ticari şartlarını aynı akışta güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(async (values) => {
                            if (!customer) return
                            await onSubmit(values, customer)
                            onOpenChange(false)
                        })}
                        className="space-y-5"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={customer?.id ?? "customer-editor"}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="space-y-5"
                            >
                                <div className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4">
                                    <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                                        Genel Bilgiler
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        Firma Adı
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Firma adı" />
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
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <UserRound className="h-4 w-4" />
                                                        Yetkili Kişi
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Yetkili kişi" />
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
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        Telefon
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="+90..." />
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
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        E-posta
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder="ornek@firma.com" />
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
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="LEAD">Potansiyel Müşteri</SelectItem>
                                                            <SelectItem value="CUSTOMER">Müşteri</SelectItem>
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
                                                    <FormLabel>Satış Temsilcisi</FormLabel>
                                                    <Select
                                                        value={field.value || NONE_VALUE}
                                                        onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
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
                                            name="sectorValueId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <Shapes className="h-4 w-4" />
                                                        Sektör
                                                    </FormLabel>
                                                    <Select
                                                        value={field.value || NONE_VALUE}
                                                        onValueChange={(value) => {
                                                            const normalized = value === NONE_VALUE ? "" : value
                                                            field.onChange(normalized)
                                                            form.setValue("productionGroupValueId", "")
                                                            form.setValue("usageAreaValueIds", [])
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
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
                                                        onValueChange={(value) => {
                                                            const normalized = value === NONE_VALUE ? "" : value
                                                            field.onChange(normalized)
                                                            form.setValue("usageAreaValueIds", [])
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
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
                                        <FormField
                                            control={form.control}
                                            name="usageAreaValueIds"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kullanım Alanı</FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-2">
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                {usageAreaValues.map((value) => {
                                                                    const isSelected = (field.value ?? []).includes(value.id)

                                                                    return (
                                                                        <button
                                                                            key={value.id}
                                                                            type="button"
                                                                            onClick={() => toggleMultiValue("usageAreaValueIds", value.id)}
                                                                            className={cn(
                                                                                "flex min-h-11 items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition",
                                                                                isSelected
                                                                                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/8 text-neutral-950 shadow-sm"
                                                                                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                                                                            )}
                                                                        >
                                                                            <span>{value.name}</span>
                                                                            {isSelected ? <Check className="h-4 w-4 text-[var(--color-brand)]" /> : null}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                            {usageAreaValues.length === 0 ? (
                                                                <p className="text-xs text-neutral-500">
                                                                    Seçilen sektör ve üretim grubuna bağlı kullanım alanı bulunamadı.
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="note"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Not</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} rows={3} placeholder="İç iletişim notu" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {genericCustomerAttributes.length > 0 ? (
                                    <div className="rounded-3xl border border-sky-200 bg-sky-50/60 p-4">
                                        <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
                                            Profil Eşleşme Alanları
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {genericCustomerAttributes.map((attribute) => (
                                                <div key={attribute.id} className="space-y-2">
                                                    <div className="text-sm font-medium text-neutral-900">{attribute.name}</div>
                                                    <div className="grid gap-2">
                                                        {(attribute.values ?? []).map((value) => {
                                                            const isSelected = (selectedGenericAttributeValueIds ?? []).includes(value.id)

                                                            return (
                                                                <button
                                                                    key={value.id}
                                                                    type="button"
                                                                    onClick={() => toggleMultiValue("attributeValueIds", value.id)}
                                                                    className={cn(
                                                                        "flex min-h-11 items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition",
                                                                        isSelected
                                                                            ? "border-sky-400 bg-white text-neutral-950 shadow-sm"
                                                                            : "border-sky-100 bg-white/80 text-neutral-600 hover:border-sky-200",
                                                                    )}
                                                                >
                                                                    <span>{value.name}</span>
                                                                    {isSelected ? <Check className="h-4 w-4 text-sky-600" /> : null}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4">
                                    <div className="mb-4">
                                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                                            Ceyhunlar İletişimleri
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-emerald-900/70">
                                            Bu müşterinin portalında görünecek Ceyhunlar departman iletişim kişilerini seçin.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {companyContacts.map((contact) => {
                                            const isSelected = (selectedCompanyContactAssignments ?? [])
                                                .some((assignment) => assignment.companyContactId === contact.id)

                                            return (
                                                <button
                                                    key={contact.id}
                                                    type="button"
                                                    onClick={() => toggleCompanyContact(contact.id)}
                                                    className={cn(
                                                        "flex min-h-20 items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition",
                                                        isSelected
                                                            ? "border-emerald-300 bg-white text-neutral-950 shadow-sm"
                                                            : "border-emerald-100 bg-white/80 text-neutral-600 hover:border-emerald-200",
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
                                                    {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : null}
                                                </button>
                                            )
                                        })}
                                        {companyContacts.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-4 py-8 text-sm text-emerald-900/70 md:col-span-2">
                                                Henüz Ceyhunlar iletişim kaydı yok. Önce admin panelinden departman iletişimi oluşturun.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
                                    <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                                        <BadgePercent className="h-4 w-4" />
                                        Ticari Şartlar
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="generalDiscountPercent"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Genel İskonto (%)</FormLabel>
                                                    <FormControl>
                                                        <NumericInputField
                                                            value={(field.value ?? null) as number | null}
                                                            onChange={field.onChange}
                                                            placeholder="örn. 12.5"
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
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <CalendarClock className="h-4 w-4" />
                                                        Varsayılan Vade (Gün)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <NumericInputField
                                                            value={(field.value ?? null) as number | null}
                                                            onChange={field.onChange}
                                                            placeholder="örn. 30"
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
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <CreditCard className="h-4 w-4" />
                                                        Kredi Limiti
                                                    </FormLabel>
                                                    <FormControl>
                                                        <NumericInputField
                                                            value={(field.value ?? null) as number | null}
                                                            onChange={field.onChange}
                                                            placeholder="örn. 250000"
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
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className="inline-flex items-center gap-2">
                                                        <ReceiptText className="h-4 w-4" />
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
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Vazgeç
                            </Button>
                            <Button type="submit" disabled={!customer || isPending}>
                                {isPending ? "Kaydediliyor..." : "Müşteriyi Güncelle"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
