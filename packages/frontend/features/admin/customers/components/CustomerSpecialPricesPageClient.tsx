"use client"

import Image from "next/image"
import { useDeferredValue, useMemo, useState, type UIEvent } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BadgePercent, CalendarClock, Check, ChevronsUpDown, FileText, PackageSearch, Pencil, Plus, Power, ReceiptText } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    useCreateCustomerVariantSpecialPrice,
    useCustomerVariantSpecialPrices,
    useDeactivateCustomerVariantSpecialPrice,
    useUpdateCustomerVariantSpecialPrice,
} from "@/features/admin/customers/hooks/useCustomerVariantSpecialPrices"
import type { CustomerVariantSpecialPrice } from "@/features/admin/customers/api/types"
import {
    buildCustomerSpecialPricePayload,
    customerSpecialPriceFormFromRecord,
    customerSpecialPriceVariantSubtitle,
    defaultSplitPaymentSchedule,
    emptyCustomerSpecialPriceForm,
    formatCustomerSpecialPriceDate,
    formatCustomerSpecialPricePaymentSchedule,
    primaryCustomerSpecialPriceProductImage,
    sanitizeDecimalInput,
    sanitizeIntegerInput,
    customerSpecialPriceFormSchema,
    type CustomerSpecialPriceFormValues,
} from "@/features/admin/customers/specialPrices/utils/customerSpecialPriceForm"
import type { Category } from "@/features/public/categories/types"
import { useCategories } from "@/features/public/categories/hooks/useCategories"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import { useProductVariantTable } from "@/features/public/products/hooks/useProductVariantTable"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { Product } from "@/features/public/products/types"
import {
    formatMeasurementValue,
    toMeasurementLabel,
} from "@/features/public/products/utils/measurement"
import { PRICE_CURRENCY_OPTIONS } from "@/lib/pricing/currencies"
import { formatMoney } from "@/lib/customers/pricing"
import { cn } from "@/lib/utils"

type Props = {
    customerId: string
}

type ImageAssetLike = {
    role?: string | null
    type?: string | null
    url?: string | null
}

type DecimalLike = number | string | { s?: number; e?: number; d?: number[] } | null | undefined

const naturalCodeCollator = new Intl.Collator("tr-TR", {
    numeric: true,
    sensitivity: "base",
})

function getImageAssetUrl(assets?: ImageAssetLike[] | null, fallback: string | null = null) {
    const primary = assets?.find((asset) => asset.role === "PRIMARY" && asset.type === "IMAGE")
    if (primary?.url) return primary.url

    const animated = assets?.find((asset) => asset.role === "ANIMATION" && asset.type === "IMAGE")
    if (animated?.url) return animated.url

    const anyImage = assets?.find((asset) => asset.type === "IMAGE" && asset.url)
    return anyImage?.url ?? fallback
}

function getCategoryImageUrl(category: Category) {
    return getImageAssetUrl(category.assets, null)
}

function getProductImageUrl(product: Product) {
    return getImageAssetUrl(product.assets, "/placeholder.webp") ?? "/placeholder.webp"
}

function compareCategories(left: Category, right: Category) {
    return left.code - right.code
        || naturalCodeCollator.compare(left.name, right.name)
}

function compareProducts(left: Product, right: Product) {
    return naturalCodeCollator.compare(left.code, right.code)
        || naturalCodeCollator.compare(left.name, right.name)
}

function compareVariants(left: VariantTableData, right: VariantTableData) {
    return naturalCodeCollator.compare(left.fullCode, right.fullCode)
        || naturalCodeCollator.compare(left.name, right.name)
}

function decimalLikeToText(value: DecimalLike) {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") return value

    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return ""

    if (exponent >= digits.length - 1) {
        return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    }
    if (exponent < 0) {
        return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    }
    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
}

function decimalLikeToNumber(value: DecimalLike) {
    const text = decimalLikeToText(value)
    if (!text || text === "-") return null

    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
}

function getActiveVariantListPrice(variant?: VariantTableData | null, preferredCurrency?: string | null) {
    if (!variant) return null

    const activeListPrices = (variant.variantSuppliers ?? [])
        .map((supplier) => {
            if (supplier.isActive === false) return null

            const value = decimalLikeToNumber(supplier.listPrice)
            if (value === null) return null

            return {
                currency: supplier.currency ?? "TRY",
                value,
            }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((left, right) => {
            if (preferredCurrency && left.currency !== right.currency) {
                if (left.currency === preferredCurrency) return -1
                if (right.currency === preferredCurrency) return 1
            }
            return naturalCodeCollator.compare(left.currency, right.currency)
                || left.value - right.value
        })

    return activeListPrices[0] ?? null
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
    const measurements = variant.measurements?.length
        ? toMeasurementLabel(variant.measurements)
        : null
    const materials = variant.materials?.length
        ? variant.materials.map((material) => material.name).join(", ")
        : null

    return [measurements, variant.color?.name, materials].filter(Boolean).join(" · ") || "Ölçü bilgisi yok"
}

function stopScrollPropagation(event: UIEvent) {
    event.stopPropagation()
}

function getSpecialPriceStateBadge(specialPrice: CustomerVariantSpecialPrice) {
    if (specialPrice.pricing.ineligibilityReason === "SPECIAL_PRICE_EXPIRED") {
        return (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                Süresi doldu
            </Badge>
        )
    }

    if (specialPrice.pricing.ineligibilityReason === "SPECIAL_PRICE_NOT_YET_VALID") {
        return (
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800">
                Henüz geçerli değil
            </Badge>
        )
    }

    if (specialPrice.pricing.ineligibilityReason === "SPECIAL_PRICE_INACTIVE") {
        return (
            <Badge variant="outline" className="border-neutral-200 bg-neutral-100 text-neutral-700">
                Pasif fiyat
            </Badge>
        )
    }

    return null
}

export function CustomerSpecialPricesPageClient({ customerId }: Props) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerVariantSpecialPrice | null>(null)
    const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false)
    const [categorySearch, setCategorySearch] = useState("")
    const [productComboboxOpen, setProductComboboxOpen] = useState(false)
    const [productSearch, setProductSearch] = useState("")
    const [selectedProductCategoryId, setSelectedProductCategoryId] = useState("")
    const [selectedProductDraft, setSelectedProductDraft] = useState<Product | null>(null)
    const form = useForm<CustomerSpecialPriceFormValues>({
        resolver: zodResolver(customerSpecialPriceFormSchema),
        defaultValues: emptyCustomerSpecialPriceForm,
    })
    const paymentScheduleFieldArray = useFieldArray({
        control: form.control,
        name: "paymentSchedule",
    })
    const formValues = useWatch({
        control: form.control,
        defaultValue: emptyCustomerSpecialPriceForm,
    }) as CustomerSpecialPriceFormValues
    const formErrors = form.formState.errors
    const specialPricesQuery = useCustomerVariantSpecialPrices(customerId)
    const deferredProductSearch = useDeferredValue(productSearch)
    const productQueryParams = useMemo(() => ({
        page: 1,
        limit: 50,
        sort: "code",
        order: "asc" as const,
        ...(deferredProductSearch.trim() ? { search: deferredProductSearch.trim() } : {}),
        ...(selectedProductCategoryId ? { categoryId: selectedProductCategoryId } : {}),
    }), [deferredProductSearch, selectedProductCategoryId])
    const categoriesQuery = useCategories()
    const productsQuery = useProducts(productQueryParams)
    const variantsQuery = useProductVariantTable(formValues.productId)
    const createMutation = useCreateCustomerVariantSpecialPrice(customerId)
    const updateMutation = useUpdateCustomerVariantSpecialPrice(customerId)
    const deactivateMutation = useDeactivateCustomerVariantSpecialPrice(customerId)
    const specialPrices = specialPricesQuery.data?.data ?? []
    const categories = useMemo(
        () => [...(categoriesQuery.data ?? [])].sort(compareCategories),
        [categoriesQuery.data],
    )
    const deferredCategorySearch = useDeferredValue(categorySearch)
    const filteredCategories = useMemo(() => {
        const normalizedSearch = deferredCategorySearch.trim().toLocaleLowerCase("tr-TR")
        if (!normalizedSearch) return categories

        return categories.filter((category) =>
            `${category.code} ${category.name} ${category.slug}`
                .toLocaleLowerCase("tr-TR")
                .includes(normalizedSearch),
        )
    }, [categories, deferredCategorySearch])
    const selectedCategoryOption = useMemo(
        () => categories.find((category) => category.id === selectedProductCategoryId) ?? null,
        [categories, selectedProductCategoryId],
    )
    const selectedCategoryImageUrl = selectedCategoryOption
        ? getCategoryImageUrl(selectedCategoryOption)
        : null
    const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data?.data])
    const productOptions = useMemo(() => {
        const currentProduct = editing?.productVariant?.product
        const productById = new Map<string, Product>()

        if (currentProduct) productById.set(currentProduct.id, currentProduct)
        if (selectedProductDraft) productById.set(selectedProductDraft.id, selectedProductDraft)
        for (const product of products) productById.set(product.id, product)

        return Array.from(productById.values()).sort(compareProducts)
    }, [editing, products, selectedProductDraft])
    const selectedProductOption = useMemo(
        () => productOptions.find((product) => product.id === formValues.productId) ?? null,
        [formValues.productId, productOptions],
    )
    const variantOptions = useMemo(
        () => [...(variantsQuery.data ?? [])].sort(compareVariants),
        [variantsQuery.data],
    )
    const selectedVariantOption = useMemo(
        () => variantOptions.find((variant) => variant.id === formValues.productVariantId) ?? null,
        [formValues.productVariantId, variantOptions],
    )
    const selectedVariantListPrice = useMemo(
        () => getActiveVariantListPrice(selectedVariantOption, formValues.currency),
        [formValues.currency, selectedVariantOption],
    )

    function handleDialogOpenChange(nextOpen: boolean) {
        setOpen(nextOpen)
        if (!nextOpen) {
            setEditing(null)
            setCategoryComboboxOpen(false)
            setCategorySearch("")
            setProductComboboxOpen(false)
            setProductSearch("")
            setSelectedProductCategoryId("")
            setSelectedProductDraft(null)
            form.reset(emptyCustomerSpecialPriceForm)
        }
    }

    function openCreate() {
        setEditing(null)
        setCategoryComboboxOpen(false)
        setCategorySearch("")
        setProductComboboxOpen(false)
        setProductSearch("")
        setSelectedProductCategoryId("")
        setSelectedProductDraft(null)
        form.reset(emptyCustomerSpecialPriceForm)
        setOpen(true)
    }

    function openEdit(specialPrice: CustomerVariantSpecialPrice) {
        const product = specialPrice.productVariant?.product ?? null
        setEditing(specialPrice)
        setCategoryComboboxOpen(false)
        setCategorySearch("")
        setProductComboboxOpen(false)
        setProductSearch("")
        setSelectedProductCategoryId(product?.categoryId ?? "")
        setSelectedProductDraft(product)
        form.reset(customerSpecialPriceFormFromRecord(specialPrice))
        setOpen(true)
    }

    function handleProductCategoryChange(value: string) {
        setSelectedProductCategoryId(value === "__all" ? "" : value)
        setCategoryComboboxOpen(false)
        setCategorySearch("")
        setProductSearch("")
        setSelectedProductDraft(null)
        form.setValue("productId", "", { shouldDirty: true, shouldValidate: true })
        form.setValue("productVariantId", "", { shouldDirty: true, shouldValidate: true })
    }

    function selectProduct(product: Product, onChange: (value: string) => void) {
        onChange(product.id)
        setSelectedProductDraft(product)
        setProductComboboxOpen(false)
        setProductSearch("")
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
        if (value === "30") {
            form.setValue("paymentTermDays", "30", { shouldDirty: true, shouldValidate: true })
            form.setValue("paymentTermLabel", "30 Gün", { shouldDirty: true, shouldValidate: true })
            return
        }
        if (value === "60") {
            form.setValue("paymentTermDays", "60", { shouldDirty: true, shouldValidate: true })
            form.setValue("paymentTermLabel", "60 Gün", { shouldDirty: true, shouldValidate: true })
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

    function removePaymentScheduleStep(index: number) {
        paymentScheduleFieldArray.remove(index)
    }

    async function handleSubmit(values: CustomerSpecialPriceFormValues) {
        const payload = buildCustomerSpecialPricePayload(values)
        try {
            if (editing) {
                await updateMutation.mutateAsync({ specialPriceId: editing.id, data: payload })
                toast.success("Özel fiyat güncellendi.")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Özel fiyat oluşturuldu.")
            }
            setOpen(false)
        } catch {
            toast.error("Özel fiyat kaydedilemedi.")
        }
    }

    async function handleDeactivate(specialPrice: CustomerVariantSpecialPrice) {
        if (!window.confirm("Bu özel fiyat pasifleştirilsin mi?")) return

        try {
            await deactivateMutation.mutateAsync(specialPrice.id)
            toast.success("Özel fiyat pasifleştirildi.")
        } catch {
            toast.error("Özel fiyat pasifleştirilemedi.")
        }
    }

    const submitting = createMutation.isPending || updateMutation.isPending || form.formState.isSubmitting

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-neutral-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <Badge variant="secondary" className="w-fit gap-1.5">
                            <BadgePercent className="h-3.5 w-3.5" />
                            Kontrat fiyatları
                        </Badge>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Özel Fiyatlar</h2>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">
                                Müşteriye özel varyant fiyatı, minimum adet, vade, KDV ve ticari koşulları burada yönetin.
                            </p>
                        </div>
                    </div>

                    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
                        <DialogTrigger asChild>
                            <Button type="button" onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Özel Fiyat Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>{editing ? "Özel Fiyatı Düzenle" : "Özel Fiyat Oluştur"}</DialogTitle>
                                <DialogDescription>
                                    Bu kayıt yalnızca seçili müşteri ve seçili varyant için geçerli olur; liste fiyatını değiştirmez.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <div className="grid gap-4 py-2 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Kategori Filtresi</Label>
                                    <Popover open={categoryComboboxOpen} onOpenChange={setCategoryComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={categoryComboboxOpen}
                                                className="h-auto min-h-12 w-full justify-between gap-3 px-3 py-2 font-normal"
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
                                    <p className="text-xs leading-5 text-neutral-500">
                                        Kategori seçimi ürün arama sonuçlarını daraltır.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Ürün</Label>
                                    <Controller
                                        control={form.control}
                                        name="productId"
                                        render={({ field }) => (
                                            <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={productComboboxOpen}
                                                        className="h-auto min-h-12 w-full justify-between gap-3 px-3 py-2 font-normal"
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
                                                            <span className="text-neutral-400">Ürün seçin</span>
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
                                                                            onSelect={() => selectProduct(product, field.onChange)}
                                                                            className="gap-3"
                                                                        >
                                                                            <Check
                                                                                className={cn("h-4 w-4", field.value === product.id ? "opacity-100" : "opacity-0")}
                                                                            />
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
                                        )}
                                    />
                                    <p className="text-xs leading-5 text-neutral-500">
                                        İlk 50 sonuç gösterilir; ürün kodu veya adıyla arama yapabilirsiniz.
                                    </p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <Label>Varyant</Label>
                                        {formValues.productId ? (
                                            <Badge variant="outline">
                                                {variantsQuery.isLoading ? "Yükleniyor" : `${variantOptions.length} varyant`}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <Controller
                                        control={form.control}
                                        name="productVariantId"
                                        render={({ field }) => (
                                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                                                {!formValues.productId ? (
                                                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-8 text-center text-sm text-neutral-500">
                                                        Varyantları görmek için önce ürün modeli seçin.
                                                    </div>
                                                ) : variantsQuery.isLoading ? (
                                                    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-8 text-center text-sm text-neutral-500">
                                                        Varyantlar yükleniyor...
                                                    </div>
                                                ) : variantOptions.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-8 text-center text-sm text-neutral-500">
                                                        Seçili ürün için varyant bulunamadı.
                                                    </div>
                                                ) : (
                                                    <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                                        {variantOptions.map((variant) => {
                                                            const selected = field.value === variant.id
                                                            const measurementChips = getVariantMeasurementChips(variant)
                                                            const variantSummary = getVariantSummary(variant)

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
                                                                        {measurementChips.length > 0 ? (
                                                                            measurementChips.slice(0, 5).map((chip) => (
                                                                                <span
                                                                                    key={chip.key}
                                                                                    className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600"
                                                                                >
                                                                                    {chip.label}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500">
                                                                                Ölçü yok
                                                                            </span>
                                                                        )}
                                                                        {measurementChips.length > 5 ? (
                                                                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500">
                                                                                +{measurementChips.length - 5} ölçü
                                                                            </span>
                                                                        ) : null}
                                                                    </div>

                                                                    <div className="mt-3 text-xs leading-5 text-neutral-600">
                                                                        {variantSummary}
                                                                    </div>

                                                                    {(variant.color?.hex || variant.color?.name || variant.materials?.length) ? (
                                                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                                                                            {variant.color ? (
                                                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                                                                                    {variant.color.hex ? (
                                                                                        <span
                                                                                            className="h-3 w-3 rounded-full border border-neutral-200"
                                                                                            style={{ backgroundColor: variant.color.hex }}
                                                                                        />
                                                                                    ) : null}
                                                                                    {variant.color.name}
                                                                                </span>
                                                                            ) : null}
                                                                            {variant.materials?.slice(0, 2).map((material) => (
                                                                                <span key={material.id} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                                                                                    {material.name}
                                                                                </span>
                                                                            ))}
                                                                            {(variant.materials?.length ?? 0) > 2 ? (
                                                                                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                                                                                    +{(variant.materials?.length ?? 0) - 2} malzeme
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    ) : null}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                                {selectedVariantOption ? (
                                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                                                        Seçili varyant: <span className="font-mono">{selectedVariantOption.fullCode}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    />
                                    {formErrors.productVariantId?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.productVariantId.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Özel Fiyat</Label>
                                    {selectedVariantOption ? (
                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                                                Normal Liste Fiyatı
                                            </div>
                                            {selectedVariantListPrice ? (
                                                <div className="mt-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                                                    <div className="font-semibold text-neutral-950">
                                                        {formatMoney(selectedVariantListPrice.value, selectedVariantListPrice.currency)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-2 rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-500">
                                                    Bu varyant için aktif liste fiyatı bulunamadı.
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                    <Input
                                        value={formValues.price}
                                        inputMode="decimal"
                                        onChange={(event) => form.setValue("price", sanitizeDecimalInput(event.target.value), {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })}
                                    />
                                    {formErrors.price?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.price.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Para Birimi</Label>
                                    <Controller
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Para birimi seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRICE_CURRENCY_OPTIONS.map((currency) => (
                                                        <SelectItem key={currency.value} value={currency.value}>
                                                            {currency.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Minimum Sipariş Adedi</Label>
                                    <Input
                                        value={formValues.minOrderQuantity}
                                        inputMode="numeric"
                                        onChange={(event) => form.setValue("minOrderQuantity", sanitizeIntegerInput(event.target.value), {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })}
                                    />
                                    {formErrors.minOrderQuantity?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.minOrderQuantity.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Maksimum Sipariş Adedi</Label>
                                    <Input
                                        value={formValues.maxOrderQuantity}
                                        inputMode="numeric"
                                        onChange={(event) => form.setValue("maxOrderQuantity", sanitizeIntegerInput(event.target.value), {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })}
                                    />
                                    {formErrors.maxOrderQuantity?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.maxOrderQuantity.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Ödeme Vadesi</Label>
                                    <Controller
                                        control={form.control}
                                        name="paymentPreset"
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => applyPaymentPreset(value as CustomerSpecialPriceFormValues["paymentPreset"])}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Vade yok</SelectItem>
                                                    <SelectItem value="cash">Peşin</SelectItem>
                                                    <SelectItem value="30">30 Gün</SelectItem>
                                                    <SelectItem value="60">60 Gün</SelectItem>
                                                    <SelectItem value="custom">Özel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Vade Gün</Label>
                                        <Input
                                            value={formValues.paymentTermDays}
                                            inputMode="numeric"
                                            disabled={formValues.paymentPreset !== "custom" || formValues.paymentSchedule.length > 0}
                                            onChange={(event) => form.setValue("paymentTermDays", sanitizeIntegerInput(event.target.value), {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            })}
                                        />
                                        {formErrors.paymentTermDays?.message ? (
                                            <p className="text-xs text-rose-600">{formErrors.paymentTermDays.message}</p>
                                        ) : null}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Vade Etiketi</Label>
                                        <Input {...form.register("paymentTermLabel")} disabled={formValues.paymentPreset !== "custom" || formValues.paymentSchedule.length > 0} />
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:col-span-2">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <Label>Çok Adımlı Ödeme Planı</Label>
                                            <p className="mt-1 text-xs leading-5 text-neutral-500">
                                                Örn. %50 peşin + %50 30 gün vade. Adımların yüzde toplamı 100 olmalı.
                                            </p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addPaymentScheduleStep}>
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            Adım Ekle
                                        </Button>
                                    </div>

                                    {paymentScheduleFieldArray.fields.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-500">
                                            Çok adımlı ödeme yoksa üstteki tek vade alanı kullanılır.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paymentScheduleFieldArray.fields.map((step, index) => (
                                                <div key={step.id} className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-[120px_120px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Yüzde</Label>
                                                        <Input
                                                            value={formValues.paymentSchedule[index]?.percentage ?? ""}
                                                            inputMode="decimal"
                                                            onChange={(event) => form.setValue(`paymentSchedule.${index}.percentage`, sanitizeDecimalInput(event.target.value), {
                                                                shouldDirty: true,
                                                                shouldValidate: true,
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Vade Gün</Label>
                                                        <Input
                                                            value={formValues.paymentSchedule[index]?.paymentTermDays ?? ""}
                                                            inputMode="numeric"
                                                            onChange={(event) => form.setValue(`paymentSchedule.${index}.paymentTermDays`, sanitizeIntegerInput(event.target.value), {
                                                                shouldDirty: true,
                                                                shouldValidate: true,
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Etiket</Label>
                                                        <Input
                                                            {...form.register(`paymentSchedule.${index}.label`)}
                                                            placeholder="Peşin, 30 Gün"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Not</Label>
                                                        <Input
                                                            {...form.register(`paymentSchedule.${index}.note`)}
                                                            placeholder="Opsiyonel"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentScheduleStep(index)}>
                                                            Kaldır
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formErrors.paymentSchedule?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.paymentSchedule.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Geçerlilik Başlangıcı</Label>
                                    <Input type="date" {...form.register("validFrom")} />
                                    {formErrors.validFrom?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.validFrom.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Geçerlilik Bitişi</Label>
                                    <Input type="date" {...form.register("validUntil")} />
                                    {formErrors.validUntil?.message ? (
                                        <p className="text-xs text-rose-600">{formErrors.validUntil.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Teslimat / Lojistik Şartı</Label>
                                    <Input {...form.register("deliveryTerm")} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Kontrat / Teklif Referansı</Label>
                                    <Input {...form.register("contractReference")} />
                                </div>

                                <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                                    <Controller
                                        control={form.control}
                                        name="taxIncluded"
                                        render={({ field }) => (
                                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                        )}
                                    />
                                    KDV dahil
                                </label>

                                <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                                    <Controller
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                        )}
                                    />
                                    Aktif
                                </label>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Müşteriye Görünecek Not</Label>
                                    <Textarea rows={3} {...form.register("note")} />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Internal Note</Label>
                                    <Textarea rows={3} {...form.register("internalNote")} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {specialPricesQuery.isLoading ? (
                    <div className="p-6 text-sm text-neutral-500">Özel fiyatlar yükleniyor...</div>
                ) : specialPrices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                        <PackageSearch className="h-8 w-8 text-neutral-400" />
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-neutral-950">Henüz özel fiyat yok</h3>
                            <p className="max-w-xl text-sm leading-6 text-neutral-500">
                                Bu müşteriye özel varyant fiyatı tanımlandığında burada listelenecek.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 p-4">
                        {specialPrices.map((specialPrice) => (
                            <div key={specialPrice.id} className="grid gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-[120px_minmax(0,1fr)_260px]">
                                <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                                    <Image src={primaryCustomerSpecialPriceProductImage(specialPrice)} alt={specialPrice.productVariant?.product?.name ?? "Ürün"} fill sizes="120px" className="object-contain p-2" />
                                </div>

                                <div className="min-w-0 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Özel Fiyat</Badge>
                                        <Badge variant={specialPrice.isActive ? "secondary" : "outline"}>{specialPrice.isActive ? "Aktif" : "Pasif"}</Badge>
                                        <Badge variant="outline">{specialPrice.taxIncluded ? "KDV dahil" : "KDV hariç"}</Badge>
                                        {getSpecialPriceStateBadge(specialPrice)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-950">{specialPrice.productVariant?.product?.name ?? "Ürün"}</h3>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {specialPrice.productVariant?.product?.code} - {specialPrice.productVariant?.fullCode}
                                        </p>
                                        <p className="mt-1 text-sm text-neutral-600">{customerSpecialPriceVariantSubtitle(specialPrice)}</p>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-white px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Liste</div>
                                            <div className="mt-1 text-sm font-medium">{formatMoney(specialPrice.pricing.listPrice, specialPrice.pricing.currency)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Özel</div>
                                            <div className="mt-1 text-sm font-semibold text-emerald-900">{formatMoney(specialPrice.pricing.finalPrice, specialPrice.pricing.currency)}</div>
                                        </div>
                                        <div className="rounded-2xl bg-white px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Vade</div>
                                            <div className="mt-1 text-sm font-medium">{formatCustomerSpecialPricePaymentSchedule(specialPrice)}</div>
                                        </div>
                                    </div>
                                    {specialPrice.note ? (
                                        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm leading-6 text-neutral-600">
                                            {specialPrice.note}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-3">
                                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                                        <ReceiptText className="h-4 w-4 text-neutral-400" />
                                        Min: {specialPrice.minOrderQuantity ?? "-"} / Max: {specialPrice.maxOrderQuantity ?? "-"}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                                        <CalendarClock className="h-4 w-4 text-neutral-400" />
                                        {formatCustomerSpecialPriceDate(specialPrice.validUntil)}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                                        <FileText className="h-4 w-4 text-neutral-400" />
                                        {specialPrice.contractReference || "Referans yok"}
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(specialPrice)}>
                                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                            Düzenle
                                        </Button>
                                        {specialPrice.isActive ? (
                                            <Button type="button" variant="outline" size="sm" onClick={() => handleDeactivate(specialPrice)}>
                                                <Power className="mr-1.5 h-3.5 w-3.5" />
                                                Pasifleştir
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
