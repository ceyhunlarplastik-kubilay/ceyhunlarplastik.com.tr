"use client"

import { useEffect, useMemo, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import type { LucideIcon } from "lucide-react"
import {
    BadgePercent,
    Building2,
    Clock3,
    FileBadge2,
    MapPin,
    PackageSearch,
    Send,
    Sparkles,
    UserRound,
} from "lucide-react"
import { parseAsStringLiteral, useQueryStates } from "nuqs"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
    BUSINESS_REQUEST_PRIORITY_LABELS,
    CUSTOMER_PORTAL_REQUEST_TYPES,
} from "@/features/businessRequests/config"
import { useCreatePortalBusinessRequest } from "@/features/businessRequests/hooks/useCreatePortalBusinessRequest"
import { CustomerPortalRequestDraftPanel } from "@/features/customerPortal/components/CustomerPortalRequestDraftPanel"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"
import { type PortalRequestDraftItem, usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"

const draftPanelStateValues = ["closed", "open"] as const
const composeTypeParser = parseAsStringLiteral(CUSTOMER_PORTAL_REQUEST_TYPES)
const draftPanelParser = parseAsStringLiteral(draftPanelStateValues)

const requestTypeMeta: Record<typeof CUSTOMER_PORTAL_REQUEST_TYPES[number], {
    description: string
    detailTitle: string
    entityType: "CUSTOMER" | "ORDER" | "DOCUMENT" | "PRODUCT_VARIANT"
    icon: LucideIcon
    label: string
}> = {
    CUSTOMER_PROFILE_CHANGE: {
        label: "Profil Değişikliği",
        description: "Firma, yetkili kişi, iletişim ve adres bilgilerinizde kontrollü değişiklik talebi oluşturun.",
        detailTitle: "Profil alanlarını güncelleyin",
        entityType: "CUSTOMER",
        icon: Building2,
    },
    CUSTOMER_ORDER_REQUEST: {
        label: "Sipariş Talebi",
        description: "Sepete eklediğiniz varyantları miktar, teslim beklentisi ve pazarlık notlarıyla sipariş talebine dönüştürün.",
        detailTitle: "Sipariş talebini hazırlayın",
        entityType: "ORDER",
        icon: PackageSearch,
    },
    CUSTOMER_DOCUMENT_REQUEST: {
        label: "Doküman Talebi",
        description: "Teknik çizim, sertifika, katalog veya 3D model gibi dökümanları ürün bağlamıyla birlikte talep edin.",
        detailTitle: "İstenen dökümanı tarif edin",
        entityType: "DOCUMENT",
        icon: FileBadge2,
    },
    CUSTOMER_PRICING_REQUEST: {
        label: "Fiyat Talebi",
        description: "Sepetteki varyantlar için güncel teklif, hedef fiyat ve ticari değerlendirme notu gönderin.",
        detailTitle: "Fiyat revizyon beklentinizi netleştirin",
        entityType: "PRODUCT_VARIANT",
        icon: BadgePercent,
    },
}

const documentTypeValues = [
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
    "CATALOG",
    "TEST_REPORT",
    "MATERIAL_DECLARATION",
    "THREE_D_MODEL",
    "OTHER",
] as const

const documentTypeLabels: Record<(typeof documentTypeValues)[number], string> = {
    TECHNICAL_DRAWING: "Teknik Çizim",
    CERTIFICATE: "Sertifika / Uygunluk Belgesi",
    CATALOG: "Katalog / Broşür",
    TEST_REPORT: "Test Raporu",
    MATERIAL_DECLARATION: "Malzeme Beyanı",
    THREE_D_MODEL: "3D Model / STEP",
    OTHER: "Diğer",
}

const addressDraftSchema = z.object({
    label: z.string().trim().max(80),
    contactName: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().max(160).optional(),
    country: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80),
    district: z.string().trim().max(80).optional(),
    line1: z.string().trim().max(240),
    line2: z.string().trim().max(240).optional(),
    postalCode: z.string().trim().max(30).optional(),
    taxOffice: z.string().trim().max(120).optional(),
    isPrimary: z.boolean(),
    isBilling: z.boolean(),
    isShipping: z.boolean(),
    note: z.string().trim().max(1000).optional(),
})

const optionalEmailSchema = z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((value) => {
        if (!value) return true
        return z.string().email().safeParse(value).success
    }, {
        message: "Geçerli bir e-posta girin.",
    })

const portalRequestSchema = z.object({
    type: z.enum(CUSTOMER_PORTAL_REQUEST_TYPES),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    title: z.string().trim().max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    profileCompanyName: z.string().trim().max(160).optional(),
    profileFullName: z.string().trim().max(160).optional(),
    profilePhone: z.string().trim().max(40).optional(),
    profileEmail: optionalEmailSchema,
    profileNote: z.string().trim().max(2000).optional(),
    addresses: z.array(addressDraftSchema).max(10),
    deliveryDate: z.string().trim().optional(),
    shippingAddressId: z.string().trim().optional(),
    referenceCode: z.string().trim().max(80).optional(),
    commercialNote: z.string().trim().max(2000).optional(),
    negotiationNote: z.string().trim().max(2000).optional(),
    documentTypes: z.array(z.enum(documentTypeValues)),
    documentFormat: z.string().trim().max(80).optional(),
    documentProductReference: z.string().trim().max(160).optional(),
    documentVariantReference: z.string().trim().max(160).optional(),
    documentPurpose: z.string().trim().max(2000).optional(),
    documentNeededAt: z.string().trim().optional(),
    pricingNeededAt: z.string().trim().optional(),
    pricingReason: z.string().trim().max(240).optional(),
    pricingExpectation: z.string().trim().max(240).optional(),
}).superRefine((values, ctx) => {
    if (values.type === "CUSTOMER_PROFILE_CHANGE") {
        if (!values.profileFullName?.trim()) {
            ctx.addIssue({
                code: "custom",
                message: "Yetkili kişi bilgisi gerekli.",
                path: ["profileFullName"],
            })
        }

        if (!values.profilePhone?.trim()) {
            ctx.addIssue({
                code: "custom",
                message: "Telefon bilgisi gerekli.",
                path: ["profilePhone"],
            })
        }

        if (!values.profileEmail?.trim()) {
            ctx.addIssue({
                code: "custom",
                message: "E-posta bilgisi gerekli.",
                path: ["profileEmail"],
            })
        }
    }

    if (values.type === "CUSTOMER_DOCUMENT_REQUEST" && values.documentTypes.length === 0) {
        ctx.addIssue({
            code: "custom",
            message: "En az bir döküman tipi seçin.",
            path: ["documentTypes"],
        })
    }
})

type PortalRequestFormValues = z.infer<typeof portalRequestSchema>

function emptyAddress() {
    return {
        label: "",
        contactName: "",
        phone: "",
        email: "",
        country: "Turkiye",
        city: "",
        district: "",
        line1: "",
        line2: "",
        postalCode: "",
        taxOffice: "",
        isPrimary: false,
        isBilling: false,
        isShipping: true,
        note: "",
    }
}

function normalizeDraftQuantity(quantity: number) {
    if (!Number.isFinite(quantity)) return 1
    return Math.max(1, Math.min(100000, Math.round(quantity)))
}

function buildRequestItemPayload(items: PortalRequestDraftItem[]) {
    return items.map((item) => ({
        productVariantId: item.variantId,
        quantity: normalizeDraftQuantity(item.quantity),
        note: item.customerNote?.trim() || undefined,
        data: {
            productId: item.productId,
            productSlug: item.productSlug,
            productName: item.productName,
            productCode: item.productCode,
            variantName: item.variantName ?? null,
            variantKey: item.variantKey,
            variantFullCode: item.variantFullCode,
            listUnitPrice: item.listUnitPrice ?? null,
            targetUnitPrice: item.targetUnitPrice ?? null,
            currency: item.currency ?? "TRY",
        },
    }))
}

export function CustomerPortalRequestComposer() {
    const customerQuery = usePortalCustomer()
    const createMutation = useCreatePortalBusinessRequest()
    const items = usePortalRequestDraftStore((state) => state.items)
    const updateQuantity = usePortalRequestDraftStore((state) => state.updateQuantity)
    const updateItem = usePortalRequestDraftStore((state) => state.updateItem)
    const removeItem = usePortalRequestDraftStore((state) => state.removeItem)
    const clear = usePortalRequestDraftStore((state) => state.clear)

    const [composerState, setComposerState] = useQueryStates({
        composeType: composeTypeParser.withDefault("CUSTOMER_ORDER_REQUEST"),
        draft: draftPanelParser.withDefault("closed"),
    })

    const draftPanelRef = useRef<HTMLDivElement | null>(null)
    const hydratedCustomerIdRef = useRef<string | null>(null)
    const customer = customerQuery.data

    const form = useForm<PortalRequestFormValues>({
        resolver: zodResolver(portalRequestSchema),
        defaultValues: {
            type: "CUSTOMER_ORDER_REQUEST",
            priority: "NORMAL",
            title: "",
            description: "",
            profileCompanyName: "",
            profileFullName: "",
            profilePhone: "",
            profileEmail: "",
            profileNote: "",
            addresses: [],
            deliveryDate: "",
            shippingAddressId: "",
            referenceCode: "",
            commercialNote: "",
            negotiationNote: "",
            documentTypes: [],
            documentFormat: "",
            documentProductReference: "",
            documentVariantReference: "",
            documentPurpose: "",
            documentNeededAt: "",
            pricingNeededAt: "",
            pricingReason: "",
            pricingExpectation: "",
        },
    })

    const { fields: addressFields, append, remove } = useFieldArray({
        control: form.control,
        name: "addresses",
    })

    const requestType = form.watch("type")
    const shippingAddressId = form.watch("shippingAddressId")
    const currentMeta = requestTypeMeta[requestType]
    const CurrentTypeIcon = currentMeta.icon
    const isItemBasedRequest = requestType === "CUSTOMER_ORDER_REQUEST" || requestType === "CUSTOMER_PRICING_REQUEST"
    const totalQuantity = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items],
    )

    const selectedShippingAddress = useMemo(
        () => customer?.addresses?.find((address) => address.id === shippingAddressId) ?? null,
        [customer?.addresses, shippingAddressId],
    )

    useEffect(() => {
        form.setValue("type", composerState.composeType, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [composerState.composeType, form])

    useEffect(() => {
        if (!customer?.id || hydratedCustomerIdRef.current === customer.id) return

        hydratedCustomerIdRef.current = customer.id

        const primaryShippingAddress =
            customer.addresses?.find((address) => address.isPrimary && address.isShipping)
            ?? customer.addresses?.find((address) => address.isShipping)
            ?? customer.addresses?.[0]

        form.reset({
            ...form.getValues(),
            type: composerState.composeType,
            profileCompanyName: customer.companyName ?? "",
            profileFullName: customer.fullName,
            profilePhone: customer.phone,
            profileEmail: customer.email,
            profileNote: customer.note ?? "",
            addresses: (customer.addresses ?? []).map((address) => ({
                label: address.label,
                contactName: address.contactName ?? "",
                phone: address.phone ?? "",
                email: address.email ?? "",
                country: address.country,
                city: address.city,
                district: address.district ?? "",
                line1: address.line1,
                line2: address.line2 ?? "",
                postalCode: address.postalCode ?? "",
                taxOffice: address.taxOffice ?? "",
                isPrimary: address.isPrimary,
                isBilling: address.isBilling,
                isShipping: address.isShipping,
                note: address.note ?? "",
            })),
            shippingAddressId: primaryShippingAddress?.id ?? "",
        })
    }, [composerState.composeType, customer, form])

    useEffect(() => {
        if (composerState.draft !== "open" || !isItemBasedRequest) return
        draftPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        })
    }, [composerState.draft, isItemBasedRequest])

    function selectRequestType(nextType: typeof CUSTOMER_PORTAL_REQUEST_TYPES[number]) {
        form.setValue("type", nextType, { shouldValidate: true })
        void setComposerState({
            composeType: nextType,
            draft: nextType === "CUSTOMER_ORDER_REQUEST" || nextType === "CUSTOMER_PRICING_REQUEST"
                ? composerState.draft
                : "closed",
        })
    }

    async function onSubmit(values: PortalRequestFormValues) {
        if (!customer) return

        if (isItemBasedRequest && items.length === 0) {
            void setComposerState({ draft: "open" })
            form.setError("type", {
                type: "manual",
                message: "Bu talep tipi için önce sepetinize en az bir varyant ekleyin.",
            })
            return
        }

        if (values.type === "CUSTOMER_ORDER_REQUEST" && (customer.addresses?.length ?? 0) > 0 && !values.shippingAddressId) {
            form.setError("shippingAddressId", {
                type: "manual",
                message: "Sipariş talebi için teslim / sevkiyat adresi seçin.",
            })
            return
        }

        const commonContext = {
            channel: "CUSTOMER_PORTAL",
            companyName: customer.companyName ?? null,
            customerFullName: customer.fullName,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            assignedSalesUser: customer.assignedSalesUser?.identifier ?? null,
        }

        switch (values.type) {
            case "CUSTOMER_PROFILE_CHANGE": {
                const normalizedAddresses = values.addresses
                    .filter((address) => address.label.trim() && address.city.trim() && address.line1.trim())
                    .map((address, index) => ({
                        label: address.label.trim(),
                        contactName: address.contactName?.trim() || null,
                        phone: address.phone?.trim() || null,
                        email: address.email?.trim() || null,
                        country: address.country?.trim() || "Turkiye",
                        city: address.city.trim(),
                        district: address.district?.trim() || null,
                        line1: address.line1.trim(),
                        line2: address.line2?.trim() || null,
                        postalCode: address.postalCode?.trim() || null,
                        taxOffice: address.taxOffice?.trim() || null,
                        isPrimary: address.isPrimary || index === 0,
                        isBilling: address.isBilling,
                        isShipping: address.isShipping,
                        note: address.note?.trim() || null,
                        displayOrder: index,
                    }))

                await createMutation.mutateAsync({
                    type: values.type,
                    title: values.title?.trim() || undefined,
                    description: values.description?.trim() || undefined,
                    priority: values.priority,
                    entityType: currentMeta.entityType,
                    entityId: customer.id,
                    requestedData: {
                        ...commonContext,
                        changeScope: "PROFILE",
                        proposedProfile: {
                            companyName: values.profileCompanyName?.trim() || null,
                            fullName: values.profileFullName?.trim() || null,
                            phone: values.profilePhone?.trim() || null,
                            email: values.profileEmail?.trim() || null,
                            note: values.profileNote?.trim() || null,
                            addresses: normalizedAddresses,
                        },
                        currentProfileSummary: {
                            companyName: customer.companyName ?? null,
                            fullName: customer.fullName,
                            phone: customer.phone,
                            email: customer.email,
                            note: customer.note ?? null,
                            addressCount: customer.addresses?.length ?? 0,
                        },
                    },
                })
                break
            }
            case "CUSTOMER_ORDER_REQUEST": {
                await createMutation.mutateAsync({
                    type: values.type,
                    title: values.title?.trim() || undefined,
                    description: values.description?.trim() || undefined,
                    priority: values.priority,
                    entityType: currentMeta.entityType,
                    entityId: customer.id,
                    requestedData: {
                        ...commonContext,
                        requestMode: "ORDER",
                        requestedDeliveryDate: values.deliveryDate || null,
                        shippingAddressId: selectedShippingAddress?.id ?? null,
                        shippingAddressLabel: selectedShippingAddress?.label ?? null,
                        shippingAddressSummary: selectedShippingAddress
                            ? [
                                selectedShippingAddress.line1,
                                selectedShippingAddress.district,
                                selectedShippingAddress.city,
                                selectedShippingAddress.country,
                            ].filter(Boolean).join(", ")
                            : null,
                        referenceCode: values.referenceCode?.trim() || null,
                        commercialNote: values.commercialNote?.trim() || null,
                        negotiationNote: values.negotiationNote?.trim() || null,
                        draftItemCount: items.length,
                        draftQuantity: totalQuantity,
                    },
                    items: buildRequestItemPayload(items),
                })
                clear()
                void setComposerState({ draft: "closed" })
                break
            }
            case "CUSTOMER_DOCUMENT_REQUEST": {
                await createMutation.mutateAsync({
                    type: values.type,
                    title: values.title?.trim() || undefined,
                    description: values.description?.trim() || undefined,
                    priority: values.priority,
                    entityType: currentMeta.entityType,
                    entityId: customer.id,
                    requestedData: {
                        ...commonContext,
                        documentTypes: values.documentTypes,
                        documentFormat: values.documentFormat?.trim() || null,
                        productReference: values.documentProductReference?.trim() || null,
                        variantReference: values.documentVariantReference?.trim() || null,
                        documentPurpose: values.documentPurpose?.trim() || null,
                        neededAt: values.documentNeededAt || null,
                    },
                })
                break
            }
            case "CUSTOMER_PRICING_REQUEST": {
                await createMutation.mutateAsync({
                    type: values.type,
                    title: values.title?.trim() || undefined,
                    description: values.description?.trim() || undefined,
                    priority: values.priority,
                    entityType: currentMeta.entityType,
                    entityId: customer.id,
                    requestedData: {
                        ...commonContext,
                        requestMode: "PRICING",
                        referenceCode: values.referenceCode?.trim() || null,
                        quoteNeededAt: values.pricingNeededAt || null,
                        pricingReason: values.pricingReason?.trim() || null,
                        pricingExpectation: values.pricingExpectation?.trim() || null,
                        commercialNote: values.commercialNote?.trim() || null,
                        draftItemCount: items.length,
                        draftQuantity: totalQuantity,
                    },
                    items: buildRequestItemPayload(items),
                })
                clear()
                void setComposerState({ draft: "closed" })
                break
            }
        }

        form.reset({
            ...form.getValues(),
            type: values.type,
            title: "",
            description: "",
            referenceCode: "",
            commercialNote: "",
            negotiationNote: "",
            documentFormat: "",
            documentProductReference: "",
            documentVariantReference: "",
            documentPurpose: "",
            documentNeededAt: "",
            pricingNeededAt: "",
            pricingReason: "",
            pricingExpectation: "",
            deliveryDate: "",
        })
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            <Sparkles className="h-3.5 w-3.5" />
                            Talep Merkezi
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                            Talep tipine göre doğru akışı seçin
                        </h2>
                        <p className="max-w-3xl text-sm leading-6 text-neutral-500">
                            Her talep aynı formu kullanmaz. Profil değişikliği müşteri verisini, sipariş ve fiyat talepleri sepet kalemlerini,
                            döküman talepleri ise sadece ilgili belge ihtiyacını toplar.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                        Atanmış satış temsilcisi:
                        <span className="ml-1 font-medium text-neutral-900">
                            {customer?.assignedSalesUser?.identifier ?? "Henüz atanmadı"}
                        </span>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-4">
                    {Object.entries(requestTypeMeta).map(([type, meta]) => {
                        const Icon = meta.icon
                        const isActive = type === requestType

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => selectRequestType(type as typeof CUSTOMER_PORTAL_REQUEST_TYPES[number])}
                                className={`rounded-2xl border p-4 text-left transition ${
                                    isActive
                                        ? "border-brand bg-brand/5 shadow-sm"
                                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className={`inline-flex rounded-2xl p-2 ${isActive ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700"}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    {isActive ? <Badge>Aktif</Badge> : null}
                                </div>
                                <div className="mt-4 text-base font-semibold text-neutral-950">{meta.label}</div>
                                <p className="mt-2 text-sm leading-6 text-neutral-500">{meta.description}</p>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className={`grid gap-6 ${isItemBasedRequest ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.95fr)]" : "xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]"}`}>
                <div className="space-y-5 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            <CurrentTypeIcon className="h-3.5 w-3.5" />
                            {currentMeta.label}
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{currentMeta.detailTitle}</h3>
                        <p className="max-w-3xl text-sm leading-6 text-neutral-500">{currentMeta.description}</p>
                    </div>

                    <Form {...form}>
                        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)]">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Başlık</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={requestType === "CUSTOMER_ORDER_REQUEST"
                                                        ? "Örn. Haziran üretimi için sipariş talebi"
                                                        : requestType === "CUSTOMER_PRICING_REQUEST"
                                                            ? "Örn. Sözleşme yenileme öncesi fiyat teyidi"
                                                            : requestType === "CUSTOMER_DOCUMENT_REQUEST"
                                                                ? "Örn. Teknik resim ve sertifika talebi"
                                                                : "Örn. Firma iletişim bilgisi güncellemesi"}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>Boş bırakırsanız sistem uygun varsayılan başlığı kullanır.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Öncelik</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Öncelik" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(BUSINESS_REQUEST_PRIORITY_LABELS).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {requestType === "CUSTOMER_PROFILE_CHANGE" ? (
                                <div className="space-y-6">
                                    <Separator />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="profileCompanyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Firma Adı</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Firma adı" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="profileFullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Yetkili Kişi</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Yetkili kişi" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="profileEmail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>E-posta</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="iletisim@firma.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="profilePhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Telefon</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+90 ..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="profileNote"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Profil Notu</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Firma bilgisi değişikliği, yeni fatura adresi veya iletişim değişikliği ile ilgili kısa açıklama bırakın."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-medium text-neutral-900">Adres Önerileri</div>
                                                <p className="mt-1 text-sm text-neutral-500">
                                                    Değişmesi gereken fatura veya sevkiyat adreslerini talep içine ekleyin.
                                                </p>
                                            </div>

                                            <Button type="button" variant="outline" onClick={() => append(emptyAddress())}>
                                                Adres Ekle
                                            </Button>
                                        </div>

                                        {addressFields.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
                                                Talebe eklenecek adres yoksa bu alanı boş bırakabilirsiniz.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {addressFields.map((field, index) => (
                                                    <div key={field.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                        <div className="mb-4 flex items-center justify-between gap-3">
                                                            <div className="text-sm font-medium text-neutral-900">
                                                                {form.watch(`addresses.${index}.label`) || `Adres ${index + 1}`}
                                                            </div>
                                                            <Button type="button" size="sm" variant="ghost" onClick={() => remove(index)}>
                                                                Kaldır
                                                            </Button>
                                                        </div>

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <Input {...form.register(`addresses.${index}.label`)} placeholder="Merkez, Depo, Fatura..." />
                                                            <Input {...form.register(`addresses.${index}.contactName`)} placeholder="İrtibat kişisi" />
                                                            <Input {...form.register(`addresses.${index}.phone`)} placeholder="Telefon" />
                                                            <Input {...form.register(`addresses.${index}.email`)} placeholder="E-posta" />
                                                            <Input {...form.register(`addresses.${index}.country`)} placeholder="Ülke" />
                                                            <Input {...form.register(`addresses.${index}.city`)} placeholder="Şehir" />
                                                            <Input {...form.register(`addresses.${index}.district`)} placeholder="İlçe" />
                                                            <Input {...form.register(`addresses.${index}.postalCode`)} placeholder="Posta kodu" />
                                                            <Input {...form.register(`addresses.${index}.taxOffice`)} placeholder="Vergi dairesi" />
                                                            <div className="md:col-span-2">
                                                                <Input {...form.register(`addresses.${index}.line1`)} placeholder="Adres satırı 1" />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <Input {...form.register(`addresses.${index}.line2`)} placeholder="Adres satırı 2" />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <Textarea {...form.register(`addresses.${index}.note`)} rows={3} placeholder="Adresle ilgili açıklama" />
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-4">
                                                            <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                                                                <Checkbox
                                                                    checked={form.watch(`addresses.${index}.isPrimary`)}
                                                                    onCheckedChange={(checked) => form.setValue(`addresses.${index}.isPrimary`, Boolean(checked))}
                                                                />
                                                                Birincil
                                                            </label>
                                                            <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                                                                <Checkbox
                                                                    checked={form.watch(`addresses.${index}.isBilling`)}
                                                                    onCheckedChange={(checked) => form.setValue(`addresses.${index}.isBilling`, Boolean(checked))}
                                                                />
                                                                Fatura
                                                            </label>
                                                            <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                                                                <Checkbox
                                                                    checked={form.watch(`addresses.${index}.isShipping`)}
                                                                    onCheckedChange={(checked) => form.setValue(`addresses.${index}.isShipping`, Boolean(checked))}
                                                                />
                                                                Sevkiyat
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {requestType === "CUSTOMER_ORDER_REQUEST" ? (
                                <div className="space-y-6">
                                    <Separator />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="deliveryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Talep Edilen Teslim Tarihi</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shippingAddressId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sevkiyat Adresi</FormLabel>
                                                    <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Sevkiyat adresi seçin" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="__none__">Adres seçmeden devam et</SelectItem>
                                                            {(customer?.addresses ?? []).map((address) => (
                                                                <SelectItem key={address.id} value={address.id}>
                                                                    {address.label} • {address.city}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="referenceCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Müşteri Referansı / Sipariş Kodu</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Opsiyonel referans kodu" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="negotiationNote"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pazarlık Notu</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn. Hacim bazlı revize fiyat beklentisi" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="commercialNote"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ticari Not</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Termin, sevkiyat, alternatif ürün veya pazarlık beklentisini buraya yazın."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : null}

                            {requestType === "CUSTOMER_DOCUMENT_REQUEST" ? (
                                <div className="space-y-6">
                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="text-sm font-medium text-neutral-900">İstenen Döküman Tipleri</div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {documentTypeValues.map((value) => {
                                                const checked = form.watch("documentTypes").includes(value)
                                                return (
                                                    <label key={value} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(nextChecked) => {
                                                                const current = form.getValues("documentTypes")
                                                                form.setValue(
                                                                    "documentTypes",
                                                                    nextChecked
                                                                        ? [...current, value]
                                                                        : current.filter((item) => item !== value),
                                                                    { shouldValidate: true },
                                                                )
                                                            }}
                                                        />
                                                        <span>{documentTypeLabels[value]}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                        {form.formState.errors.documentTypes?.message ? (
                                            <p className="text-sm text-red-600">{form.formState.errors.documentTypes.message}</p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="documentFormat"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tercih Edilen Format</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="PDF, STEP, IGES, ZIP..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="documentNeededAt"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>İhtiyaç Tarihi</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="documentProductReference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ürün Model Referansı</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn. 10.11 / Ürün adı" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="documentVariantReference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Varyant / Full Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn. 10.11.B.V1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="documentPurpose"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Talep Amacı</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Örn. son müşteri onayı, kalite dosyası, teklif dosyası veya teknik değerlendirme için gerekli."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : null}

                            {requestType === "CUSTOMER_PRICING_REQUEST" ? (
                                <div className="space-y-6">
                                    <Separator />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="referenceCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Teklif / Müşteri Referansı</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Opsiyonel teklif referansı" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="pricingNeededAt"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fiyat Teyit Tarihi</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="pricingReason"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Talep Nedeni</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn. Enflasyon nedeniyle güncel fiyat teyidi" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="pricingExpectation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ticari Beklenti</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn. yıllık hacim için revize teklif" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="commercialNote"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ek Ticari Not</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Liste fiyatının güncellik endişesi, hedef teklif yaklaşımı veya sipariş hacmi notunu yazın."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : null}

                            <Separator />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Genel Açıklama</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                rows={5}
                                                placeholder={requestType === "CUSTOMER_PROFILE_CHANGE"
                                                    ? "Bu değişiklik talebinin neden gerekli olduğunu ve etkisini kısa şekilde açıklayın."
                                                    : requestType === "CUSTOMER_DOCUMENT_REQUEST"
                                                        ? "Belgenin neden gerektiğini ve hangi süreçte kullanılacağını açıklayın."
                                                        : requestType === "CUSTOMER_PRICING_REQUEST"
                                                            ? "Genel fiyat beklentisi, ticari bağlam veya süre baskısını özetleyin."
                                                            : "Sipariş bağlamını, termin hassasiyetini veya operasyonel notları burada özetleyin."}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.type?.message ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {form.formState.errors.type.message}
                                </div>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="submit" disabled={createMutation.isPending}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {createMutation.isPending ? "Gönderiliyor..." : "Talebi Oluştur"}
                                </Button>

                                {isItemBasedRequest ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setComposerState({ draft: "open" })}
                                    >
                                        Sepeti Aç
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </Form>
                </div>

                {isItemBasedRequest ? (
                    <div ref={draftPanelRef}>
                        <CustomerPortalRequestDraftPanel
                            highlighted={composerState.draft === "open"}
                            items={items}
                            mode={requestType === "CUSTOMER_PRICING_REQUEST" ? "pricing" : "order"}
                            totalQuantity={totalQuantity}
                            updateQuantity={updateQuantity}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            clear={clear}
                        />
                    </div>
                ) : (
                    <div className="space-y-5 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <Clock3 className="h-4 w-4" />
                                Approval Akışı
                            </div>
                            <p className="mt-3 text-sm leading-6 text-neutral-600">
                                Müşteri portalından açılan satış talepleri önce satış ekibi, ardından satış direktörü ve son aşamada admin/owner tarafından kontrol edilir.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <UserRound className="h-4 w-4" />
                                Mevcut Profil Özeti
                            </div>
                            <div className="mt-4 space-y-3 text-sm text-neutral-700">
                                <div>Firma: {customer?.companyName || "-"}</div>
                                <div>Yetkili: {customer?.fullName || "-"}</div>
                                <div>E-posta: {customer?.email || "-"}</div>
                                <div>Telefon: {customer?.phone || "-"}</div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <MapPin className="h-4 w-4" />
                                Adres Kayıtları
                            </div>
                            <div className="mt-3 text-sm text-neutral-600">
                                {(customer?.addresses?.length ?? 0) > 0
                                    ? `${customer?.addresses?.length ?? 0} kayıtlı adresiniz bulunuyor. Profil değişikliği talebine yalnızca değişmesi gereken adresleri ekleyin.`
                                    : "Kayıtlı adres bulunmuyor. Yeni adres ihtiyacınızı profil değişikliği talebine ekleyebilirsiniz."}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
