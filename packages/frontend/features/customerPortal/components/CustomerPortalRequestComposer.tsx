"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { Clock3, MapPin, Send, UserRound } from "lucide-react"
import { parseAsStringLiteral, useQueryStates } from "nuqs"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { CustomerDocumentRequestFields } from "@/features/customerPortal/components/requestComposer/CustomerDocumentRequestFields"
import { CustomerOrderRequestCreateFlow } from "@/features/customerPortal/components/requestComposer/CustomerOrderRequestCreateFlow"
import { CustomerOrderRequestFields } from "@/features/customerPortal/components/requestComposer/CustomerOrderRequestFields"
import { CustomerPortalRequestTypePicker } from "@/features/customerPortal/components/requestComposer/CustomerPortalRequestTypePicker"
import { CustomerPricingRequestCreateFlow } from "@/features/customerPortal/components/requestComposer/CustomerPricingRequestCreateFlow"
import { CustomerPricingRequestFields } from "@/features/customerPortal/components/requestComposer/CustomerPricingRequestFields"
import { CustomerProfileChangeFields } from "@/features/customerPortal/components/requestComposer/CustomerProfileChangeFields"
import { ShippingAddressDraftDialog } from "@/features/customerPortal/components/requestComposer/ShippingAddressDraftDialog"
import { buildRequestItemPayload, getRequestFlowFlags } from "@/features/customerPortal/components/requestComposer/helpers"
import {
    addressDraftSchema,
    buildAddressSummary,
    emptyAddress,
    hasMeaningfulAddressInput,
    portalRequestSchema,
    requestTypeMeta,
    ShippingAddressOption,
    type PortalRequestFormValues,
} from "@/features/customerPortal/components/requestComposer/schema"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { getPrimaryCustomerContact } from "@/lib/customers/contactCards"
import { getUserDisplayName } from "@/lib/users/displayName"

const draftPanelStateValues = ["closed", "open"] as const
const composeTypeParser = parseAsStringLiteral(CUSTOMER_PORTAL_REQUEST_TYPES)
const draftPanelParser = parseAsStringLiteral(draftPanelStateValues)

type CustomerPortalRequestComposerProps = {
    forcedType?: typeof CUSTOMER_PORTAL_REQUEST_TYPES[number]
    forceDraftOpen?: boolean
    showTypePicker?: boolean
}

export function CustomerPortalRequestComposer({
    forcedType,
    forceDraftOpen = false,
    showTypePicker = !forcedType,
}: CustomerPortalRequestComposerProps = {}) {
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
    const [shippingDialogOpen, setShippingDialogOpen] = useState(false)
    const [draftShippingAddresses, setDraftShippingAddresses] = useState<ShippingAddressOption[]>([])
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

    const requestType = forcedType ?? form.watch("type")
    const currentMeta = requestTypeMeta[requestType]
    const CurrentTypeIcon = currentMeta.icon
    const { isOrderRequest, isPricingRequest, requiresDraftItems } = getRequestFlowFlags(requestType)
    const shippingAddressId = form.watch("shippingAddressId")
    const totalQuantity = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items],
    )

    const shippingAddressOptions = useMemo<ShippingAddressOption[]>(
        () => [
            ...((customer?.addresses ?? []).map((address) => ({
                id: address.id,
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
                isPersisted: true,
            }))),
            ...draftShippingAddresses,
        ],
        [customer?.addresses, draftShippingAddresses],
    )

    const selectedShippingAddress = useMemo(
        () => shippingAddressOptions.find((address) => address.id === shippingAddressId) ?? null,
        [shippingAddressId, shippingAddressOptions],
    )
    const primaryContact = useMemo(
        () => customer ? getPrimaryCustomerContact(customer) : null,
        [customer],
    )

    useEffect(() => {
        form.setValue("type", forcedType ?? composerState.composeType, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [composerState.composeType, forcedType, form])

    useEffect(() => {
        if (!forceDraftOpen || !requiresDraftItems) return
        void setComposerState({ draft: "open" })
    }, [forceDraftOpen, requiresDraftItems, setComposerState])

    useEffect(() => {
        if (!customer?.id || hydratedCustomerIdRef.current === customer.id) return

        hydratedCustomerIdRef.current = customer.id
        setDraftShippingAddresses([])

        const primaryShippingAddress =
            customer.addresses?.find((address) => address.isPrimary && address.isShipping)
            ?? customer.addresses?.find((address) => address.isShipping)
            ?? customer.addresses?.[0]

        form.reset({
            ...form.getValues(),
            type: composerState.composeType,
            profileCompanyName: customer.companyName ?? "",
            profileFullName: primaryContact?.name || customer.fullName,
            profilePhone: primaryContact?.phone || customer.phone,
            profileEmail: primaryContact?.email || customer.email,
            profileNote: customer.note ?? "",
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
            shippingAddressId: primaryShippingAddress?.id ?? "",
        })
    }, [composerState.composeType, customer, form, primaryContact])

    useEffect(() => {
        if (composerState.draft !== "open" || !requiresDraftItems) return
        draftPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        })
    }, [composerState.draft, requiresDraftItems])

    function selectRequestType(nextType: typeof CUSTOMER_PORTAL_REQUEST_TYPES[number]) {
        if (forcedType) return
        form.setValue("type", nextType, { shouldValidate: true })
        void setComposerState({
            composeType: nextType,
            draft: getRequestFlowFlags(nextType).requiresDraftItems ? composerState.draft : "closed",
        })
    }

    function addDraftShippingAddress(address: z.infer<typeof addressDraftSchema>) {
        const id = `draft-${crypto.randomUUID()}`
        const nextAddress: ShippingAddressOption = {
            ...address,
            label: address.label.trim(),
            contactName: address.contactName?.trim() || "",
            phone: address.phone?.trim() || "",
            email: address.email?.trim() || "",
            country: address.country?.trim() || "Turkiye",
            stateName: address.stateName?.trim() || "",
            city: address.city.trim(),
            district: address.district?.trim() || "",
            line1: address.line1.trim(),
            line2: address.line2?.trim() || "",
            postalCode: address.postalCode?.trim() || "",
            taxOffice: address.taxOffice?.trim() || "",
            taxNumber: address.taxNumber?.trim() || "",
            note: address.note?.trim() || "",
            id,
            isPersisted: false,
        }

        setDraftShippingAddresses((current) => [...current, nextAddress])
        form.setValue("shippingAddressId", id, { shouldDirty: true, shouldValidate: true })
    }

    async function onSubmit(values: PortalRequestFormValues) {
        if (!customer) return

        if (requiresDraftItems && items.length === 0) {
            void setComposerState({ draft: "open" })
            form.setError("type", {
                type: "manual",
                message: "Bu talep tipi icin once sepetinize en az bir varyant ekleyin.",
            })
            return
        }

        if (isOrderRequest && shippingAddressOptions.length > 0 && !values.shippingAddressId) {
            form.setError("shippingAddressId", {
                type: "manual",
                message: "Siparis talebi icin teslim / sevkiyat adresi secin.",
            })
            return
        }

        const commonContext = {
            channel: "CUSTOMER_PORTAL",
            companyName: customer.companyName ?? null,
            customerFullName: primaryContact?.name || customer.fullName,
            customerEmail: primaryContact?.email || customer.email,
            customerPhone: primaryContact?.phone || customer.phone,
            assignedSalesUser: customer.assignedSalesUser
                ? getUserDisplayName(customer.assignedSalesUser) || customer.assignedSalesUser.email
                : null,
        }

        switch (values.type) {
            case "CUSTOMER_PROFILE_CHANGE": {
                const normalizedAddresses = values.addresses
                    .filter((address) => hasMeaningfulAddressInput(address))
                    .map((address, index) => ({
                        label: address.label.trim(),
                        contactName: address.contactName?.trim() || null,
                        phone: address.phone?.trim() || null,
                        email: address.email?.trim() || null,
                        countryId: address.countryId ?? null,
                        stateId: address.stateId ?? null,
                        cityId: address.cityId ?? null,
                        country: address.country?.trim() || "Turkiye",
                        stateName: address.stateName?.trim() || null,
                        city: address.city.trim(),
                        district: address.district?.trim() || null,
                        line1: address.line1.trim(),
                        line2: address.line2?.trim() || null,
                        postalCode: address.postalCode?.trim() || null,
                        taxOffice: address.taxOffice?.trim() || null,
                        taxNumber: address.taxNumber?.trim() || null,
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
                            fullName: primaryContact?.name || customer.fullName,
                            phone: primaryContact?.phone || customer.phone,
                            email: primaryContact?.email || customer.email,
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
                        shippingAddressId: selectedShippingAddress?.isPersisted ? selectedShippingAddress.id : null,
                        shippingAddressDraft: selectedShippingAddress && !selectedShippingAddress.isPersisted
                            ? {
                                label: selectedShippingAddress.label,
                                contactName: selectedShippingAddress.contactName || null,
                                phone: selectedShippingAddress.phone || null,
                                email: selectedShippingAddress.email || null,
                                countryId: selectedShippingAddress.countryId ?? null,
                                stateId: selectedShippingAddress.stateId ?? null,
                                cityId: selectedShippingAddress.cityId ?? null,
                                country: selectedShippingAddress.country,
                                stateName: selectedShippingAddress.stateName || null,
                                city: selectedShippingAddress.city,
                                district: selectedShippingAddress.district || null,
                                line1: selectedShippingAddress.line1,
                                line2: selectedShippingAddress.line2 || null,
                                postalCode: selectedShippingAddress.postalCode || null,
                                taxOffice: selectedShippingAddress.taxOffice || null,
                                taxNumber: selectedShippingAddress.taxNumber || null,
                                isPrimary: selectedShippingAddress.isPrimary,
                                isBilling: selectedShippingAddress.isBilling,
                                isShipping: selectedShippingAddress.isShipping,
                                note: selectedShippingAddress.note || null,
                            }
                            : null,
                        shippingAddressLabel: selectedShippingAddress?.label ?? null,
                        shippingAddressSummary: selectedShippingAddress ? buildAddressSummary(selectedShippingAddress) : null,
                        referenceCode: values.referenceCode?.trim() || null,
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

    const assignedSalesUserLabel = customer?.assignedSalesUser
        ? getUserDisplayName(customer.assignedSalesUser) || customer.assignedSalesUser.email
        : "Henuz atanmadi"

    const formCard = (
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
                                    <FormLabel>Baslik</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={isOrderRequest
                                                ? "Orn. Haziran uretimi icin siparis talebi"
                                                : isPricingRequest
                                                    ? "Orn. sozlesme yenileme oncesi fiyat teyidi"
                                                    : requestType === "CUSTOMER_DOCUMENT_REQUEST"
                                                        ? "Orn. teknik resim ve sertifika talebi"
                                                        : "Orn. firma iletisim bilgisi guncellemesi"}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>Bos birakirsaniz sistem uygun varsayilan basligi kullanir.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Oncelik</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Oncelik" />
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

                    <Separator />

                    {requestType === "CUSTOMER_PROFILE_CHANGE" ? (
                        <CustomerProfileChangeFields
                            addressFields={addressFields}
                            appendAddress={() => append(emptyAddress())}
                            removeAddress={remove}
                        />
                    ) : null}

                    {isOrderRequest ? (
                        <CustomerOrderRequestFields
                            shippingAddressOptions={shippingAddressOptions}
                            onOpenShippingDialog={() => setShippingDialogOpen(true)}
                        />
                    ) : null}

                    {requestType === "CUSTOMER_DOCUMENT_REQUEST" ? <CustomerDocumentRequestFields /> : null}
                    {isPricingRequest ? <CustomerPricingRequestFields /> : null}

                    <Separator />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Genel Aciklama</FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={5}
                                        placeholder={requestType === "CUSTOMER_PROFILE_CHANGE"
                                            ? "Bu degisiklik talebinin neden gerekli oldugunu ve etkisini kisa sekilde aciklayin."
                                            : requestType === "CUSTOMER_DOCUMENT_REQUEST"
                                                ? "Belgenin neden gerektigini ve hangi surecte kullanilacagini aciklayin."
                                                : isPricingRequest
                                                    ? "Genel fiyat beklentisi, ticari baglam veya sure baskisini ozetleyin."
                                                    : "Siparis baglamini, termin hassasiyetini veya operasyonel notlari burada ozetleyin."}
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
                            {createMutation.isPending ? "Gonderiliyor..." : "Talebi Olustur"}
                        </Button>

                        {isPricingRequest ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setComposerState({ draft: "open" })}
                            >
                                Sepeti Ac
                            </Button>
                        ) : null}
                    </div>
                </form>
            </Form>
        </div>
    )

    const draftPanelNode = requiresDraftItems ? (
        <div ref={draftPanelRef}>
            <CustomerPortalRequestDraftPanel
                id={isOrderRequest ? "customer-order-draft-panel" : undefined}
                highlighted={composerState.draft === "open"}
                items={items}
                mode={isPricingRequest ? "pricing" : "order"}
                totalQuantity={totalQuantity}
                orderSummary={isOrderRequest
                    ? {
                        requestedDeliveryDate: form.watch("deliveryDate") || null,
                        shippingAddressLabel: selectedShippingAddress?.label ?? null,
                        shippingAddressSummary: selectedShippingAddress ? buildAddressSummary(selectedShippingAddress) : null,
                        paymentTermDays: customer?.defaultPaymentTermDays ?? null,
                        paymentTermNote: customer?.paymentTermNote ?? null,
                    }
                    : undefined}
                updateQuantity={updateQuantity}
                updateItem={updateItem}
                removeItem={removeItem}
                clear={clear}
            />
        </div>
    ) : null

    return (
        <div className="space-y-6">
            {showTypePicker ? (
                <CustomerPortalRequestTypePicker
                    requestType={requestType}
                    assignedSalesUserLabel={assignedSalesUserLabel}
                    onSelect={selectRequestType}
                />
            ) : (
                <div className="rounded-[28px] border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                                <CurrentTypeIcon className="h-3.5 w-3.5" />
                                {currentMeta.label}
                            </div>
                            <p className="max-w-3xl text-sm leading-6 text-neutral-500">{currentMeta.description}</p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                            Atanmış satış temsilcisi:
                            <span className="ml-1 font-medium text-neutral-900">{assignedSalesUserLabel}</span>
                        </div>
                    </div>
                </div>
            )}

            {isOrderRequest ? (
                <CustomerOrderRequestCreateFlow
                    draftPanel={draftPanelNode}
                    formCard={formCard}
                />
            ) : isPricingRequest ? (
                <CustomerPricingRequestCreateFlow
                    draftPanel={draftPanelNode}
                    formCard={formCard}
                />
            ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                    {formCard}
                    <div className="space-y-5 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <Clock3 className="h-4 w-4" />
                                Approval Akisi
                            </div>
                            <p className="mt-3 text-sm leading-6 text-neutral-600">
                                Musteri portalindan acilan satis talepleri once satis ekibi, ardindan satis direktoru ve son asamada admin/owner tarafindan kontrol edilir.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <UserRound className="h-4 w-4" />
                                Mevcut Profil Ozeti
                            </div>
                            <div className="mt-4 space-y-3 text-sm text-neutral-700">
                                <div>Firma: {customer?.companyName || "-"}</div>
                                <div>Yetkili: {primaryContact?.name || customer?.fullName || "-"}</div>
                                <div>E-posta: {primaryContact?.email || customer?.email || "-"}</div>
                                <div>Telefon: {primaryContact?.phone || customer?.phone || "-"}</div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <MapPin className="h-4 w-4" />
                                Adres Kayitlari
                            </div>
                            <div className="mt-3 text-sm text-neutral-600">
                                {(customer?.addresses?.length ?? 0) > 0
                                    ? `${customer?.addresses?.length ?? 0} kayitli adresiniz bulunuyor. Profil degisikligi talebine yalnizca degismesi gereken adresleri ekleyin.`
                                    : "Kayitli adres bulunmuyor. Yeni adres ihtiyacinizi profil degisikligi talebine ekleyebilirsiniz."}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ShippingAddressDraftDialog
                open={shippingDialogOpen}
                onOpenChange={setShippingDialogOpen}
                onSave={addDraftShippingAddress}
            />
        </div>
    )
}
