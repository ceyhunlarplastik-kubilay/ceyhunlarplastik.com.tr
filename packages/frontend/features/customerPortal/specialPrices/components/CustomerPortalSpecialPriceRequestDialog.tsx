"use client"

import Image from "next/image"
import { useDeferredValue, useMemo, useState, type ReactNode, type UIEvent } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, Check, ChevronsUpDown, FileText, PackageSearch, Plus, Send, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreatePortalBusinessRequest } from "@/features/businessRequests/hooks/useCreatePortalBusinessRequest"
import {
    buildCustomerSpecialPricePayload,
    customerSpecialPriceFormSchema,
    defaultSplitPaymentSchedule,
    emptyCustomerSpecialPriceForm,
    sanitizeDecimalInput,
    sanitizeIntegerInput,
    type CustomerSpecialPriceFormValues,
} from "@/features/admin/customers/specialPrices/utils/customerSpecialPriceForm"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"
import { useCategories } from "@/features/public/categories/hooks/useCategories"
import type { Category } from "@/features/public/categories/types"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import type { Product } from "@/features/public/products/types"
import { useProductVariantTable } from "@/features/public/products/hooks/useProductVariantTable"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import { formatMeasurementValue, toMeasurementLabel } from "@/features/public/products/utils/measurement"
import { PRICE_CURRENCY_OPTIONS } from "@/lib/pricing/currencies"
import { formatMoney } from "@/lib/customers/pricing"
import { getUserDisplayName } from "@/lib/users/displayName"
import { cn } from "@/lib/utils"

export type CustomerSpecialPriceRequestInitialSelection = {
    categoryId?: string | null
    product?: Product | null
    productId?: string | null
    productName?: string | null
    productCode?: string | null
    productVariantId?: string | null
    variantFullCode?: string | null
    variantName?: string | null
}

type Props = {
    trigger?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    initialSelection?: CustomerSpecialPriceRequestInitialSelection | null
}

type DecimalLike = number | string | { s?: number; e?: number; d?: number[] } | null | undefined

const naturalCodeCollator = new Intl.Collator("tr-TR", {
    numeric: true,
    sensitivity: "base",
})

function getImageAssetUrl(assets?: Array<{ role?: string | null; type?: string | null; url?: string | null }> | null, fallback: string | null = null) {
    return assets?.find((asset) => asset.role === "PRIMARY" && asset.type === "IMAGE")?.url
        ?? assets?.find((asset) => asset.type === "IMAGE" && asset.url)?.url
        ?? fallback
}

function getCategoryImageUrl(category: Category) {
    return getImageAssetUrl(category.assets, null)
}

function getProductImageUrl(product: Product) {
    return getImageAssetUrl(product.assets, "/placeholder.webp") ?? "/placeholder.webp"
}

function compareCategories(left: Category, right: Category) {
    return left.code - right.code || naturalCodeCollator.compare(left.name, right.name)
}

function compareProducts(left: Product, right: Product) {
    return naturalCodeCollator.compare(left.code, right.code) || naturalCodeCollator.compare(left.name, right.name)
}

function compareVariants(left: VariantTableData, right: VariantTableData) {
    return naturalCodeCollator.compare(left.fullCode, right.fullCode) || naturalCodeCollator.compare(left.name, right.name)
}

function decimalLikeToText(value: DecimalLike) {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") return value

    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return ""

    if (exponent >= digits.length - 1) return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    if (exponent < 0) return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
}

function decimalLikeToNumber(value: DecimalLike) {
    const parsed = Number(decimalLikeToText(value))
    return Number.isFinite(parsed) ? parsed : null
}

function getActiveVariantListPrice(variant?: VariantTableData | null, preferredCurrency?: string | null) {
    const prices = (variant?.variantSuppliers ?? [])
        .map((supplier) => {
            if (supplier.isActive === false) return null
            const value = decimalLikeToNumber(supplier.listPrice)
            if (value === null) return null

            return {
                value,
                currency: supplier.currency ?? "TRY",
            }
        })
        .filter((item): item is { value: number; currency: string } => Boolean(item))
        .sort((left, right) => {
            if (preferredCurrency && left.currency !== right.currency) {
                if (left.currency === preferredCurrency) return -1
                if (right.currency === preferredCurrency) return 1
            }

            return naturalCodeCollator.compare(left.currency, right.currency) || left.value - right.value
        })

    return prices[0] ?? null
}

function getVariantMeasurementChips(variant: VariantTableData) {
    return [...(variant.measurements ?? [])]
        .sort((left, right) => left.measurementType.displayOrder - right.measurementType.displayOrder)
        .map((measurement) => ({
            key: measurement.id,
            label: `${measurement.measurementType.code}: ${formatMeasurementValue(measurement)}`,
        }))
}

function getVariantSummary(variant: VariantTableData) {
    const measurements = variant.measurements?.length ? toMeasurementLabel(variant.measurements) : null
    const materials = variant.materials?.length ? variant.materials.map((material) => material.name).join(", ") : null

    return [measurements, variant.color?.name, materials].filter(Boolean).join(" · ") || "Ölçü bilgisi yok"
}

function buildInitialValues(selection?: CustomerSpecialPriceRequestInitialSelection | null): CustomerSpecialPriceFormValues {
    return {
        ...emptyCustomerSpecialPriceForm,
        productId: selection?.productId ?? selection?.product?.id ?? "",
        productVariantId: selection?.productVariantId ?? "",
    }
}

function stopScrollPropagation(event: UIEvent) {
    event.stopPropagation()
}

export function CustomerPortalSpecialPriceRequestDialog({
    trigger,
    open,
    onOpenChange,
    initialSelection,
}: Props) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [selectedProductCategoryId, setSelectedProductCategoryId] = useState(initialSelection?.categoryId ?? "")
    const [selectedProductDraft, setSelectedProductDraft] = useState<Product | null>(initialSelection?.product ?? null)
    const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false)
    const [categorySearch, setCategorySearch] = useState("")
    const [productComboboxOpen, setProductComboboxOpen] = useState(false)
    const [productSearch, setProductSearch] = useState("")
    const dialogOpen = open ?? internalOpen
    const setDialogOpen = onOpenChange ?? setInternalOpen
    const createMutation = useCreatePortalBusinessRequest()
    const customerQuery = usePortalCustomer()
    const customer = customerQuery.data
    const categoriesQuery = useCategories()
    const categories = useMemo(
        () => [...(categoriesQuery.data ?? [])].sort(compareCategories),
        [categoriesQuery.data],
    )
    const deferredCategorySearch = useDeferredValue(categorySearch)
    const form = useForm<CustomerSpecialPriceFormValues>({
        resolver: zodResolver(customerSpecialPriceFormSchema),
        defaultValues: buildInitialValues(initialSelection),
    })
    const paymentScheduleFieldArray = useFieldArray({
        control: form.control,
        name: "paymentSchedule",
    })
    const formValues = useWatch({
        control: form.control,
        defaultValue: buildInitialValues(initialSelection),
    }) as CustomerSpecialPriceFormValues
    const productsQuery = useProducts({
        page: 1,
        limit: 100,
        sort: "code",
        order: "asc",
        ...(selectedProductCategoryId ? { categoryId: selectedProductCategoryId } : {}),
    })
    const products = useMemo(() => {
        const records = [...(productsQuery.data?.data ?? [])]
        if (selectedProductDraft && !records.some((product) => product.id === selectedProductDraft.id)) {
            records.push(selectedProductDraft)
        }

        return records.sort(compareProducts)
    }, [productsQuery.data?.data, selectedProductDraft])
    const deferredProductSearch = useDeferredValue(productSearch)
    const variantsQuery = useProductVariantTable(formValues.productId)
    const variants = useMemo(
        () => [...(variantsQuery.data ?? [])].sort(compareVariants),
        [variantsQuery.data],
    )
    const filteredCategories = useMemo(() => {
        const needle = deferredCategorySearch.trim().toLocaleLowerCase("tr-TR")
        if (!needle) return categories

        return categories.filter((category) =>
            `${category.code} ${category.name} ${category.slug}`.toLocaleLowerCase("tr-TR").includes(needle)
        )
    }, [categories, deferredCategorySearch])
    const productOptions = useMemo(() => {
        const needle = deferredProductSearch.trim().toLocaleLowerCase("tr-TR")
        const filtered = needle
            ? products.filter((product) =>
                `${product.code} ${product.name}`.toLocaleLowerCase("tr-TR").includes(needle)
            )
            : products

        return filtered.slice(0, 50)
    }, [deferredProductSearch, products])
    const selectedCategoryOption = categories.find((category) => category.id === selectedProductCategoryId) ?? null
    const selectedCategoryImageUrl = selectedCategoryOption ? getCategoryImageUrl(selectedCategoryOption) : null
    const selectedProductOption = products.find((product) => product.id === formValues.productId) ?? selectedProductDraft
    const selectedVariantOption = variants.find((variant) => variant.id === formValues.productVariantId) ?? null
    const selectedVariantListPrice = useMemo(
        () => getActiveVariantListPrice(selectedVariantOption, formValues.currency),
        [formValues.currency, selectedVariantOption],
    )

    function handleDialogOpenChange(nextOpen: boolean) {
        setDialogOpen(nextOpen)
        if (!nextOpen) {
            form.reset(buildInitialValues(initialSelection))
            paymentScheduleFieldArray.replace([])
            setSelectedProductCategoryId(initialSelection?.categoryId ?? initialSelection?.product?.categoryId ?? "")
            setSelectedProductDraft(initialSelection?.product ?? null)
            setCategoryComboboxOpen(false)
            setCategorySearch("")
            setProductComboboxOpen(false)
            setProductSearch("")
        }
    }

    function handleProductCategoryChange(value: string) {
        setSelectedProductCategoryId(value === "__all" ? "" : value)
        setSelectedProductDraft(null)
        setCategorySearch("")
        setCategoryComboboxOpen(false)
        form.setValue("productId", "", { shouldDirty: true, shouldValidate: true })
        form.setValue("productVariantId", "", { shouldDirty: true, shouldValidate: true })
    }

    function handleProductChange(productId: string) {
        const product = products.find((item) => item.id === productId) ?? null
        setSelectedProductDraft(product)
        setProductSearch("")
        setProductComboboxOpen(false)
        form.setValue("productId", productId, { shouldDirty: true, shouldValidate: true })
        form.setValue("productVariantId", "", { shouldDirty: true, shouldValidate: true })
    }

    function applyPaymentPreset(value: CustomerSpecialPriceFormValues["paymentPreset"]) {
        paymentScheduleFieldArray.replace([])
        form.setValue("paymentPreset", value, { shouldDirty: true, shouldValidate: true })
        if (value === "cash") {
            form.setValue("paymentTermDays", "0", { shouldDirty: true, shouldValidate: true })
            form.setValue("paymentTermLabel", "Peşin", { shouldDirty: true, shouldValidate: true })
            return
        }
        if (value === "30" || value === "60") {
            form.setValue("paymentTermDays", value, { shouldDirty: true, shouldValidate: true })
            form.setValue("paymentTermLabel", `${value} Gün`, { shouldDirty: true, shouldValidate: true })
            return
        }
        if (value === "none") {
            form.setValue("paymentTermDays", "", { shouldDirty: true, shouldValidate: true })
            form.setValue("paymentTermLabel", "", { shouldDirty: true, shouldValidate: true })
        }
    }

    function addPaymentScheduleStep() {
        form.setValue("paymentPreset", "none", { shouldDirty: true, shouldValidate: true })
        form.setValue("paymentTermDays", "", { shouldDirty: true, shouldValidate: true })
        form.setValue("paymentTermLabel", "", { shouldDirty: true, shouldValidate: true })
        if (paymentScheduleFieldArray.fields.length === 0) {
            paymentScheduleFieldArray.replace(defaultSplitPaymentSchedule)
            return
        }
        paymentScheduleFieldArray.append({ percentage: "", paymentTermDays: "", label: "", note: "" })
    }

    async function handleSubmit(values: CustomerSpecialPriceFormValues) {
        const payload = buildCustomerSpecialPricePayload({
            ...values,
            internalNote: "",
            isActive: true,
        })
        const product = selectedProductOption
        const variant = selectedVariantOption
        const productSnapshot = product ? {
            id: product.id,
            code: product.code,
            name: product.name,
            categoryId: product.categoryId,
            categoryName: product.category?.name ?? null,
        } : values.productId ? {
            id: values.productId,
            code: initialSelection?.productCode ?? null,
            name: initialSelection?.productName ?? null,
            categoryId: initialSelection?.categoryId ?? null,
            categoryName: null,
        } : null
        const variantSnapshot = variant ? {
            id: variant.id,
            fullCode: variant.fullCode,
            name: variant.name,
            measurementSummary: getVariantSummary(variant),
            listPrice: selectedVariantListPrice?.value ?? null,
            listPriceCurrency: selectedVariantListPrice?.currency ?? null,
        } : payload.productVariantId ? {
            id: payload.productVariantId,
            fullCode: initialSelection?.variantFullCode ?? null,
            name: initialSelection?.variantName ?? null,
            measurementSummary: null,
            listPrice: selectedVariantListPrice?.value ?? null,
            listPriceCurrency: selectedVariantListPrice?.currency ?? null,
        } : null
        const titleProductLabel = [
            productSnapshot?.code,
            productSnapshot?.name,
        ].filter((value): value is string => typeof value === "string" && Boolean(value.trim())).join(" ")

        await createMutation.mutateAsync({
            type: "CUSTOMER_PRICING_REQUEST",
            title: titleProductLabel
                ? `${titleProductLabel} özel fiyat talebi`
                : "Özel fiyat talebi",
            description: values.note.trim() || undefined,
            entityType: "PRODUCT_VARIANT",
            entityId: payload.productVariantId,
            requestedData: {
                channel: "CUSTOMER_PORTAL",
                requestKind: "CUSTOMER_SPECIAL_PRICE_REQUEST",
                requestMode: "SPECIAL_PRICE",
                companyName: customer?.companyName ?? null,
                customerFullName: customer?.fullName ?? null,
                customerEmail: customer?.email ?? null,
                customerPhone: customer?.phone ?? null,
                assignedSalesUser: customer?.assignedSalesUser
                    ? getUserDisplayName(customer.assignedSalesUser) || customer.assignedSalesUser.email
                    : null,
                specialPrice: {
                    productVariantId: payload.productVariantId,
                    price: payload.price,
                    currency: payload.currency,
                    minOrderQuantity: payload.minOrderQuantity ?? null,
                    maxOrderQuantity: payload.maxOrderQuantity ?? null,
                    paymentTermDays: payload.paymentTermDays ?? null,
                    paymentTermLabel: payload.paymentTermLabel ?? null,
                    paymentSchedule: payload.paymentSchedule ?? null,
                    validFrom: payload.validFrom ?? null,
                    validUntil: payload.validUntil ?? null,
                    taxIncluded: payload.taxIncluded ?? false,
                    deliveryTerm: payload.deliveryTerm ?? null,
                    contractReference: payload.contractReference ?? null,
                    note: payload.note ?? null,
                },
                productSnapshot,
                variantSnapshot,
            },
            items: [{
                productVariantId: payload.productVariantId,
                quantity: payload.minOrderQuantity ?? 1,
                note: payload.note ?? undefined,
                data: {
                    requestKind: "CUSTOMER_SPECIAL_PRICE_REQUEST",
                    requestedUnitPrice: payload.price,
                    targetUnitPrice: payload.price,
                    currency: payload.currency,
                    minOrderQuantity: payload.minOrderQuantity ?? null,
                    maxOrderQuantity: payload.maxOrderQuantity ?? null,
                    paymentTermDays: payload.paymentTermDays ?? null,
                    paymentTermLabel: payload.paymentTermLabel ?? null,
                    paymentSchedule: payload.paymentSchedule ?? null,
                    taxIncluded: payload.taxIncluded ?? false,
                    productName: productSnapshot?.name ?? null,
                    productCode: productSnapshot?.code ?? null,
                    variantFullCode: variantSnapshot?.fullCode ?? null,
                    variantName: variantSnapshot?.name ?? null,
                    measurementSummary: variantSnapshot?.measurementSummary ?? null,
                    listUnitPrice: selectedVariantListPrice?.value ?? null,
                    listPriceCurrency: selectedVariantListPrice?.currency ?? null,
                },
            }],
        })
        handleDialogOpenChange(false)
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Özel Fiyat Talebi Oluştur</DialogTitle>
                    <DialogDescription>
                        Talebiniz satış temsilciniz, satış direktörü ve yönetim onayından geçtikten sonra özel fiyat olarak tanımlanır.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Kategori Filtresi</Label>
                                <Popover open={categoryComboboxOpen} onOpenChange={setCategoryComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={categoryComboboxOpen}
                                            className="h-[60px] w-full justify-between gap-3 px-3 py-2 font-normal"
                                        >
                                            <span className="flex min-w-0 items-center gap-3">
                                                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                                                    {selectedCategoryOption ? (
                                                        selectedCategoryImageUrl ? (
                                                            <Image
                                                                src={selectedCategoryImageUrl}
                                                                alt={selectedCategoryOption.name}
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <PackageSearch className="h-4 w-4 text-neutral-400" />
                                                        )
                                                    ) : (
                                                        <PackageSearch className="h-4 w-4 text-neutral-400" />
                                                    )}
                                                </span>
                                                <span className="min-w-0 text-left">
                                                    <span className="block truncate text-sm text-neutral-900">
                                                        {selectedCategoryOption ? selectedCategoryOption.name : "Tüm kategoriler"}
                                                    </span>
                                                    <span className="block truncate text-xs text-neutral-500">
                                                        {selectedCategoryOption ? `Kategori no ${selectedCategoryOption.code}` : "Kategori filtresi kapalı"}
                                                    </span>
                                                </span>
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[--radix-popover-trigger-width] p-0"
                                        align="start"
                                        onWheelCapture={stopScrollPropagation}
                                        onTouchMoveCapture={stopScrollPropagation}
                                    >
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Kategori no, adı veya slug ara..."
                                                value={categorySearch}
                                                onValueChange={setCategorySearch}
                                            />
                                            <CommandList
                                                className="max-h-[min(360px,var(--radix-popover-content-available-height))] overscroll-contain"
                                                onWheelCapture={stopScrollPropagation}
                                                onTouchMoveCapture={stopScrollPropagation}
                                            >
                                                <CommandEmpty>
                                                    {categoriesQuery.isFetching ? "Kategoriler yükleniyor..." : "Kategori bulunamadı."}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="Tüm kategoriler"
                                                        onSelect={() => handleProductCategoryChange("__all")}
                                                        className="gap-3"
                                                    >
                                                        <Check className={cn("h-4 w-4", !selectedProductCategoryId ? "opacity-100" : "opacity-0")} />
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                                                            <PackageSearch className="h-4 w-4 text-neutral-400" />
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-medium">Tüm kategoriler</span>
                                                            <span className="block text-xs text-neutral-500">Kategori filtresi kapalı</span>
                                                        </span>
                                                    </CommandItem>
                                                    {filteredCategories.map((category) => {
                                                        const categoryImageUrl = getCategoryImageUrl(category)

                                                        return (
                                                            <CommandItem
                                                                key={category.id}
                                                                value={`${category.code} ${category.name} ${category.slug}`}
                                                                onSelect={() => handleProductCategoryChange(category.id)}
                                                                className="gap-3"
                                                            >
                                                                <Check className={cn("h-4 w-4", selectedProductCategoryId === category.id ? "opacity-100" : "opacity-0")} />
                                                                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                                                                    {categoryImageUrl ? (
                                                                        <Image
                                                                            src={categoryImageUrl}
                                                                            alt={category.name}
                                                                            fill
                                                                            sizes="44px"
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <PackageSearch className="h-4 w-4 text-neutral-400" />
                                                                    )}
                                                                </span>
                                                                <span className="min-w-0">
                                                                    <span className="block truncate text-sm font-medium">{category.name}</span>
                                                                    <span className="block truncate text-xs text-neutral-500">
                                                                        Kategori no {category.code}
                                                                    </span>
                                                                </span>
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Ürün Modeli</Label>
                                <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={productComboboxOpen}
                                            className="h-[60px] w-full justify-between gap-3 px-3 py-2 font-normal"
                                        >
                                            {selectedProductOption ? (
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                                                        <Image
                                                            src={getProductImageUrl(selectedProductOption)}
                                                            alt={selectedProductOption.name}
                                                            fill
                                                            sizes="40px"
                                                            className="object-contain p-1.5"
                                                        />
                                                    </span>
                                                    <span className="min-w-0 text-left">
                                                        <span className="block truncate text-sm text-neutral-900">
                                                            {selectedProductOption.code} - {selectedProductOption.name}
                                                        </span>
                                                        <span className="block truncate text-xs text-neutral-500">
                                                            {selectedProductOption.category?.name
                                                                ?? categories.find((item) => item.id === selectedProductOption.categoryId)?.name
                                                                ?? "Kategori yok"}
                                                        </span>
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400">
                                                    {productsQuery.isFetching ? "Ürünler yükleniyor..." : "Ürün seçin"}
                                                </span>
                                            )}
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[--radix-popover-trigger-width] p-0"
                                        align="start"
                                        onWheelCapture={stopScrollPropagation}
                                        onTouchMoveCapture={stopScrollPropagation}
                                    >
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Ürün kodu veya adı ara..."
                                                value={productSearch}
                                                onValueChange={setProductSearch}
                                            />
                                            <CommandList
                                                className="max-h-[min(380px,var(--radix-popover-content-available-height))] overscroll-contain"
                                                onWheelCapture={stopScrollPropagation}
                                                onTouchMoveCapture={stopScrollPropagation}
                                            >
                                                <CommandEmpty>
                                                    {productsQuery.isFetching ? "Ürünler yükleniyor..." : "Ürün bulunamadı."}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {productOptions.map((product) => {
                                                        const category = product.category ?? categories.find((item) => item.id === product.categoryId)

                                                        return (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={`${product.code} ${product.name}`}
                                                                onSelect={() => handleProductChange(product.id)}
                                                                className="gap-3"
                                                            >
                                                                <Check className={cn("h-4 w-4", formValues.productId === product.id ? "opacity-100" : "opacity-0")} />
                                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                                                                    <Image
                                                                        src={getProductImageUrl(product)}
                                                                        alt={product.name}
                                                                        fill
                                                                        sizes="48px"
                                                                        className="object-contain p-1.5"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="truncate text-sm font-semibold">
                                                                        {product.code} - {product.name}
                                                                    </div>
                                                                    <div className="mt-0.5 truncate text-xs text-neutral-500">
                                                                        {category?.name ?? "Kategori yok"}
                                                                    </div>
                                                                </div>
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {selectedProductOption ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                                    <Image
                                        src={getImageAssetUrl(selectedProductOption.assets, "/placeholder.webp") ?? "/placeholder.webp"}
                                        alt={selectedProductOption.name}
                                        fill
                                        sizes="56px"
                                        className="object-contain p-1.5"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-neutral-950">
                                        {selectedProductOption.code} - {selectedProductOption.name}
                                    </div>
                                    <div className="mt-1 truncate text-xs text-neutral-500">
                                        {selectedProductOption.category?.name ?? "Kategori bilgisi yok"}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <FormField
                            control={form.control}
                            name="productVariantId"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <FormLabel>Varyant</FormLabel>
                                        {formValues.productId ? (
                                            <Badge variant="outline">
                                                {variantsQuery.isLoading ? "Yükleniyor" : `${variants.length} varyant`}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <FormControl>
                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                                            {!formValues.productId ? (
                                                <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-8 text-center text-sm text-neutral-500">
                                                    Varyantları görmek için önce ürün modeli seçin.
                                                </div>
                                            ) : variantsQuery.isLoading ? (
                                                <div className="rounded-xl border border-neutral-200 bg-white px-3 py-8 text-center text-sm text-neutral-500">
                                                    Varyantlar yükleniyor...
                                                </div>
                                            ) : variants.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-8 text-center text-sm text-neutral-500">
                                                    Seçili ürün için varyant bulunamadı.
                                                </div>
                                            ) : (
                                                <div className="grid max-h-[320px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                                    {variants.map((variant) => {
                                                        const selected = field.value === variant.id
                                                        const measurementChips = getVariantMeasurementChips(variant)

                                                        return (
                                                            <button
                                                                key={variant.id}
                                                                type="button"
                                                                role="radio"
                                                                aria-checked={selected}
                                                                onClick={() => field.onChange(variant.id)}
                                                                className={cn(
                                                                    "rounded-2xl border bg-white p-3 text-left transition",
                                                                    selected
                                                                        ? "border-brand bg-brand/5 shadow-sm ring-2 ring-brand/10"
                                                                        : "border-neutral-200 hover:border-neutral-300 hover:bg-white/80",
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <div className="font-mono text-xs text-neutral-500">{variant.fullCode}</div>
                                                                        <div className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900">
                                                                            {variant.name}
                                                                        </div>
                                                                    </div>
                                                                    {selected ? (
                                                                        <Badge className="gap-1 bg-brand text-white hover:bg-brand">
                                                                            <Check className="h-3 w-3" />
                                                                            Seçili
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                                    {measurementChips.slice(0, 5).map((chip) => (
                                                                        <span
                                                                            key={chip.key}
                                                                            className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600"
                                                                        >
                                                                            {chip.label}
                                                                        </span>
                                                                    ))}
                                                                    {measurementChips.length === 0 ? (
                                                                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500">
                                                                            Ölçü yok
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="mt-3 text-xs leading-5 text-neutral-600">
                                                                    {getVariantSummary(variant)}
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedVariantListPrice ? (
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                                    <FileText className="h-3.5 w-3.5" />
                                    Liste fiyatı referansı
                                </div>
                                <div className="mt-1 text-lg font-semibold text-sky-950">
                                    {formatMoney(selectedVariantListPrice.value, selectedVariantListPrice.currency)}
                                </div>
                            </div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Talep Edilen Özel Fiyat</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="decimal"
                                                placeholder="0,00"
                                                {...field}
                                                onChange={(event) => field.onChange(sanitizeDecimalInput(event.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Para Birimi</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Para birimi" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PRICE_CURRENCY_OPTIONS.map((currency) => (
                                                    <SelectItem key={currency.value} value={currency.value}>
                                                        {currency.label}
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
                                name="minOrderQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Sipariş Adedi</FormLabel>
                                        <FormControl>
                                            <Input {...field} inputMode="numeric" onChange={(event) => field.onChange(sanitizeIntegerInput(event.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxOrderQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Maksimum Sipariş Adedi</FormLabel>
                                        <FormControl>
                                            <Input {...field} inputMode="numeric" onChange={(event) => field.onChange(sanitizeIntegerInput(event.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <Label>Ödeme / Vade Koşulu</Label>
                                    <p className="mt-1 text-xs text-neutral-500">Basit vade seçebilir veya çok adımlı ödeme planı tanımlayabilirsiniz.</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addPaymentScheduleStep}>
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Ödeme Adımı
                                </Button>
                            </div>

                            <div className="mb-4 grid gap-2 sm:grid-cols-4">
                                {[
                                    ["none", "Vade yok"],
                                    ["cash", "Peşin"],
                                    ["30", "30 Gün"],
                                    ["60", "60 Gün"],
                                ].map(([value, label]) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        variant={formValues.paymentPreset === value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => applyPaymentPreset(value as CustomerSpecialPriceFormValues["paymentPreset"])}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>

                            {paymentScheduleFieldArray.fields.length === 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="paymentTermDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vade Günü</FormLabel>
                                                <FormControl>
                                                    <Input {...field} inputMode="numeric" onChange={(event) => field.onChange(sanitizeIntegerInput(event.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="paymentTermLabel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vade Etiketi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Orn. 30 Gün" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paymentScheduleFieldArray.fields.map((field, index) => (
                                        <div key={field.id} className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-[90px_110px_1fr_auto]">
                                            <FormField
                                                control={form.control}
                                                name={`paymentSchedule.${index}.percentage`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>%</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} inputMode="decimal" onChange={(event) => field.onChange(sanitizeDecimalInput(event.target.value))} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`paymentSchedule.${index}.paymentTermDays`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Gün</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} inputMode="numeric" onChange={(event) => field.onChange(sanitizeIntegerInput(event.target.value))} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`paymentSchedule.${index}.label`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Etiket</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Peşin / 30 Gün" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => paymentScheduleFieldArray.remove(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {form.formState.errors.paymentSchedule?.message ? (
                                        <p className="text-sm text-red-600">{form.formState.errors.paymentSchedule.message}</p>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="deliveryTerm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teslim Koşulu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Orn. Depo teslim" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractReference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Referans</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opsiyonel müşteri referansı" {...field} />
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
                                    <FormLabel>Talep Notu</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={4}
                                            placeholder="Hedef hacim, proje, periyodik alım veya fiyat beklentinizin gerekçesini yazın."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                            <div className="inline-flex items-center gap-2 text-xs text-neutral-500">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Talep onaylandığında özel fiyat kaydı oluşur.
                            </div>
                            <Button type="submit" disabled={createMutation.isPending || form.formState.isSubmitting}>
                                <Send className="mr-2 h-4 w-4" />
                                {createMutation.isPending ? "Gönderiliyor..." : "Özel Fiyat Talebi Oluştur"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
