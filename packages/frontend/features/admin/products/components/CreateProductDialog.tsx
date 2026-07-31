"use client"

import { useMemo, useState } from "react"
import axios from "axios"
import slugify from "slugify"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useCreateProduct } from "@/features/admin/products/hooks/useCreateProduct"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"
import { ProductIndustrialUsageEditor } from "@/features/admin/products/components/ProductIndustrialUsageEditor"
import { ProductVideoLinksCard } from "@/features/admin/products/components/ProductVideoLinksCard"
import { ProductFormSection } from "@/features/admin/products/components/ProductFormSection"
import { AdminLocaleSelect } from "@/features/admin/shared/translations/AdminLocaleSelect"
import { ProductTranslatableFields } from "@/features/admin/products/components/ProductTranslatableFields"
import { presignProductAsset } from "@/features/admin/products/api/presignProductAsset"
import {
    PRODUCT_FORM_DEFAULT_LOCALE,
    PRODUCT_FORM_LOCALES,
    buildProductTranslationDefaults,
    productFormSchema,
    productTranslationIndex,
    type ProductFormLocale,
    type ProductFormValues,
} from "../schema/productFormSchema"
import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onCreated: (product: Product) => void
}

const PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"]

function getAcceptByType(assetType: AssetType) {
    switch (assetType) {
        case "IMAGE":
            return "image/*"
        case "VIDEO":
            return "video/*"
        case "PDF":
            return "application/pdf"
        default:
            return "*"
    }
}

export function CreateProductDialog({
    open,
    onOpenChange,
    categories,
    onCreated,
}: Props) {
    const createMutation = useCreateProduct()
    const [file, setFile] = useState<File | null>(null)
    const [assetType, setAssetType] = useState<AssetType>("IMAGE")
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeLocale, setActiveLocale] = useState<ProductFormLocale>(PRODUCT_FORM_DEFAULT_LOCALE)

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            categoryId: "",
            attributeValueIds: [],
            industrialUsages: [],
            translations: buildProductTranslationDefaults(),
        },
    })

    const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" })
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId)
    const watchedName = useWatch({ control: form.control, name: "name" })
    const watchedCode = useWatch({ control: form.control, name: "code" })
    const accept = useMemo(() => getAcceptByType(assetType), [assetType])
    const slugPreview = useMemo(
        () => (watchedName ? slugify(watchedName, { lower: true, strict: true, locale: "tr" }) : "urun-slug"),
        [watchedName]
    )
    const watchedTranslations = useWatch({ control: form.control, name: "translations" })
    const filledLocales = PRODUCT_FORM_LOCALES.filter((locale) => {
        if (locale === PRODUCT_FORM_DEFAULT_LOCALE) return Boolean(watchedName?.trim())
        return Boolean(watchedTranslations?.[productTranslationIndex(locale)]?.name?.trim())
    })

    async function onSubmit(values: ProductFormValues) {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            let assetKey: string | undefined
            let mimeType: string | undefined

            if (file) {
                const presigned = await presignProductAsset({
                    productSlug: slugPreview,
                    assetRole,
                    fileName: file.name,
                    contentType: file.type,
                })

                await axios.put(presigned.uploadUrl, file, {
                    headers: { "Content-Type": file.type },
                    onUploadProgress: (event) => {
                        const percent = Math.round((event.loaded * 100) / (event.total || 1))
                        setUploadProgress(percent)
                    },
                })

                assetKey = presigned.key
                mimeType = file.type
            }

            const product = await createMutation.mutateAsync({
                ...values,
                assetType,
                assetRole,
                assetKey,
                mimeType,
            })

            toast.success("Ürün başarıyla oluşturuldu")
            onCreated(product)
            onOpenChange(false)
            form.reset({
                name: "",
                code: "",
                description: "",
                categoryId: "",
                attributeValueIds: [],
                industrialUsages: [],
                translations: buildProductTranslationDefaults(),
            })
            setFile(null)
            setUploadProgress(0)
            setAssetType("IMAGE")
            setAssetRole("PRIMARY")
        } catch {
            toast.error("Ürün oluşturulamadı")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
                <DialogHeader className="space-y-2">
                    <DialogTitle>Yeni Ürün</DialogTitle>
                    <DialogDescription>
                        Ürün temel bilgilerini, bağlı kategorisini, attribute seçimlerini ve ilk medya dosyasını tek adımda tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Tek kolon: tüm bölüm başlıkları alt alta hizalanır (Edit dialog ile aynı). */}
                    <div className="space-y-4">
                        <ProductFormSection
                            narrow
                            title="Tanımlayıcılar"
                            description="Koda ve kategoriye bağlı alanlar; dile göre değişmez."
                        >
                            <FieldGroup>
                                <Controller
                                    name="code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Ürün kodu</FieldLabel>
                                            <Input {...field} className="font-mono tabular-nums" placeholder="10.11" />
                                            {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="categoryId"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Kategori</FieldLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Kategori seç" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            <span className="font-mono tabular-nums text-xs text-neutral-500">
                                                                {category.code}
                                                            </span>
                                                            {" · "}
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                                        </Field>
                                    )}
                                />

                                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2.5">
                                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                                        Kod uyumu
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-700">
                                        {selectedCategory && watchedCode
                                            ? watchedCode.startsWith(`${selectedCategory.code}.`) || watchedCode === String(selectedCategory.code)
                                                ? "Kategori kodu ile uyumlu."
                                                : `Kod ${selectedCategory.code} ile başlamalı.`
                                            : "Kategori ve kod seçildiğinde kontrol edilir."}
                                    </p>
                                </div>
                            </FieldGroup>
                        </ProductFormSection>

                        <ProductFormSection
                            narrow
                            title="İçerik"
                            description="Ad, slug ve açıklama seçili dile yazılır."
                            actions={
                                <AdminLocaleSelect
                                    value={activeLocale}
                                    onChange={setActiveLocale}
                                    filledLocales={filledLocales}
                                />
                            }
                        >
                            <ProductTranslatableFields
                                control={form.control}
                                locale={activeLocale}
                                slugPreview={slugPreview}
                            />
                        </ProductFormSection>

                        <ProductVideoLinksCard control={form.control} />

                        <ProductFormSection
                            narrow
                            title="Kapak dosyası"
                            description="İlk görseli veya destekleyici medyayı ürünle birlikte yükleyin."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel>Dosya tipi</FieldLabel>
                                    <Select value={assetType} onValueChange={(value) => setAssetType(value as AssetType)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Dosya tipi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IMAGE">Resim</SelectItem>
                                            <SelectItem value="VIDEO">Video</SelectItem>
                                            <SelectItem value="PDF">PDF</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field>
                                    <FieldLabel>Rol</FieldLabel>
                                    <Select value={assetRole} onValueChange={(value) => setAssetRole(value as AssetRole)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRIMARY">Primary</SelectItem>
                                            <SelectItem value="ANIMATION">Animation</SelectItem>
                                            <SelectItem value="GALLERY">Gallery</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <Field className="mt-4">
                                <FieldLabel>Dosya</FieldLabel>
                                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-7 text-center transition-colors duration-200 hover:border-neutral-400 hover:bg-neutral-100">
                                    <ImagePlus className="mb-2.5 h-5 w-5 text-neutral-400" />
                                    <span className="text-sm font-medium text-neutral-800">
                                        {file ? file.name : "Dosya seç veya sürükleyip bırak"}
                                    </span>
                                    <span className="mt-1 text-xs text-neutral-500">
                                        {assetType === "IMAGE" ? "Görsel" : assetType === "VIDEO" ? "Video" : "PDF"} kabul edilir
                                    </span>
                                    <Input
                                        type="file"
                                        accept={accept}
                                        className="hidden"
                                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </Field>

                            {uploadProgress > 0 && uploadProgress < 100 ? (
                                <div className="mt-4 space-y-2">
                                    <Progress value={uploadProgress} />
                                    <p className="text-xs tabular-nums text-neutral-500">Yükleme %{uploadProgress}</p>
                                </div>
                            ) : null}
                        </ProductFormSection>

                        <ProductFormSection
                            title="Attribute alanları"
                            description="Kategoriye bağlı filtre attribute'ları. Sektör, üretim grubu ve kullanım alanı aşağıdaki bölümde yönetilir."
                            actions={
                                <Badge variant="secondary" className="rounded-full bg-brand/10 text-brand">
                                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                                    Akıllı seçim
                                </Badge>
                            }
                        >
                            <Controller
                                name="attributeValueIds"
                                control={form.control}
                                render={({ field }) => (
                                    <ProductAttributeSelect
                                        value={field.value ?? []}
                                        onChange={field.onChange}
                                        allowedAttributeValueIds={selectedCategory?.allowedAttributeValueIds}
                                        singleSelectNonHierarchy
                                        excludeAttributeCodes={PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES}
                                    />
                                )}
                            />
                        </ProductFormSection>
                    </div>

                    <Controller
                        name="industrialUsages"
                        control={form.control}
                        render={({ field }) => (
                            <ProductIndustrialUsageEditor
                                productSlug={slugPreview}
                                value={field.value ?? []}
                                onChange={field.onChange}
                                activeLocale={activeLocale}
                            />
                        )}
                    />

                    <div className="sticky bottom-0 -mx-6 flex flex-col-reverse gap-3 border-t border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-end">
                        <p className="mr-auto text-xs text-neutral-500">
                            Yüklenen görseller ve video linkleri yalnız kaydettikten sonra kalıcı olur.
                        </p>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                            {isSubmitting || createMutation.isPending ? "Oluşturuluyor..." : "Ürünü oluştur"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
