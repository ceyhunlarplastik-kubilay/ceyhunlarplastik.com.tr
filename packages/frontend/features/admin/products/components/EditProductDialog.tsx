"use client"

import { useMemo, useState } from "react"
import slugify from "slugify"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

import { useUpdateProduct } from "@/features/admin/products/hooks/useUpdateProduct"
import { useProduct } from "@/features/admin/products/hooks/useProduct"
import { ProductAssetManager } from "@/features/admin/products/components/asset/ProductAssetManager"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"
import { ProductIndustrialUsageEditor } from "@/features/admin/products/components/ProductIndustrialUsageEditor"
import { ProductVideoLinksCard } from "@/features/admin/products/components/ProductVideoLinksCard"
import { buildProductUpdatePayload } from "@/features/admin/products/api/serializeProductPayload"
import { ProductFormSection } from "@/features/admin/products/components/ProductFormSection"
import { AdminLocaleSelect } from "@/features/admin/shared/translations/AdminLocaleSelect"
import { ProductTranslatableFields } from "@/features/admin/products/components/ProductTranslatableFields"
import {
    PRODUCT_FORM_DEFAULT_LOCALE,
    PRODUCT_FORM_LOCALES,
    buildProductTranslationDefaults,
    isProductFormLocale,
    productFormSchema,
    productTranslationIndex,
    type ProductFormLocale,
    type ProductFormValues,
} from "../schema/productFormSchema"

import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"

type Props = {
    product: Product
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onUpdated: (product: Product) => void
}

const PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"]

// P1.8(a): Liste "card" view'a indiği için satır-prop'unda industrialUsages yok.
// Dialog açılınca tam ürünü (attributeValues + industrialUsages + assets) fetch
// eder; form default'ları tam veriyle bir kez kurulsun diye form iç bileşene
// ayrıldı (effect ile form.reset yerine — mount-anı defaultValues).
export function EditProductDialog({
    product,
    open,
    onOpenChange,
    categories,
    onUpdated,
}: Props) {
    const { data: fullProduct, isLoading, isError, refetch } = useProduct(product.id, {
        enabled: open,
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-1">
                    <DialogTitle>Ürünü düzenle</DialogTitle>
                    <DialogDescription>
                        Dile bağlı alanlar seçili dile yazılır; kod, kategori ve medya tüm diller için ortaktır.
                    </DialogDescription>
                </DialogHeader>

                {isError ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <p className="text-sm text-red-600">Ürün bilgisi yüklenemedi.</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                            Tekrar dene
                        </Button>
                    </div>
                ) : isLoading || !fullProduct ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-sm text-neutral-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ürün yükleniyor...
                    </div>
                ) : (
                    <EditProductForm
                        product={fullProduct}
                        categories={categories}
                        onUpdated={onUpdated}
                        refetchProduct={refetch}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

type EditProductFormProps = {
    product: Product
    categories: Category[]
    onUpdated: (product: Product) => void
    /** Asset yüklendikten sonra tam ürünü tazeler (eskiden location.reload() vardı). */
    refetchProduct: () => Promise<unknown>
}

function EditProductForm({ product, categories, onUpdated, refetchProduct }: EditProductFormProps) {
    const updateMutation = useUpdateProduct()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: product.name,
            code: product.code,
            description: product.description ?? "",
            categoryId: product.categoryId,
            assemblyVideoUrl: product.assemblyVideoUrl ?? "",
            promoVideoUrl: product.promoVideoUrl ?? "",
            attributeValueIds: product.attributeValues
                ?.filter((value) => !PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES.includes(value.attribute?.code ?? ""))
                .map((v) => v.id) ?? [],
            industrialUsages: product.industrialUsages?.map((usage, index) => ({
                id: usage.id ?? null,
                sectorValueId: usage.sectorValueId ?? null,
                productionGroupValueId: usage.productionGroupValueId ?? null,
                usageAreaValueId: usage.usageAreaValueId ?? null,
                usageFunction: usage.usageFunction ?? "",
                // Tanınmayan bir locale kodu forma alınamaz (şema `SUPPORTED_LOCALES`
                // ile sınırlı) ve dizi kirlendiğinde tamamı gönderildiği için o satır
                // sunucuda da SİLİNİR. Bu ancak desteklenen diller listesinden bir dil
                // ÇIKARILIRSA olur; sessiz kalmamak için uyarı basılır.
                translations: usage.translations
                    ?.filter((translation) => {
                        if (isProductFormLocale(translation.locale)) return true

                        console.warn(
                            `Desteklenmeyen locale'li endüstriyel kullanım çevirisi forma alınmadı: ${translation.locale}. Kaydedilirse bu çeviri silinir.`,
                        )
                        return false
                    })
                    .map((translation) => ({
                        locale: translation.locale as ProductFormLocale,
                        usageFunction: translation.usageFunction,
                        imageKey: translation.imageKey ?? null,
                        imageUrl: translation.imageUrl ?? null,
                    })) ?? [],
                imageKey: usage.imageKey ?? null,
                imageUrl: usage.imageUrl ?? null,
                displayOrder: usage.displayOrder ?? index,
            })) ?? [],
            translations: buildProductTranslationDefaults(product.translations),
        },
    })

    // RHF `formState` bir Proxy: hangi alana abone olunacağını RENDER sırasındaki
    // okumalardan çıkarıyor. `dirtyFields`'i yalnız onSubmit içinde okumak abonelik
    // kurmaz ve alan boş kalır → istek 200 döner ama hiçbir şeyi değiştirmez.
    // Bu yüzden burada, render gövdesinde okunuyor.
    const { dirtyFields } = form.formState
    const [activeLocale, setActiveLocale] = useState<ProductFormLocale>(PRODUCT_FORM_DEFAULT_LOCALE)
    const watchedTranslations = useWatch({ control: form.control, name: "translations" })

    const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" })
    const watchedName = useWatch({ control: form.control, name: "name" })
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId)
    const productSlug = useMemo(
        () => slugify(watchedName || product.name, { lower: true, strict: true, locale: "tr" }),
        [watchedName, product.name],
    )

    async function onSubmit(data: ProductFormValues) {
        try {
            // Yalnız değişen alanlar gönderilir; handler gönderilmeyen alan için
            // hiç iş yapmıyor (çeviri upsert'i, industrialUsages normalizasyonu,
            // attribute doğrulaması hepsi koşullu). Hiçbir alan kirli değilse
            // buildProductUpdatePayload tüm veriyi döndürür — bkz. güvenlik ağı.
            const updated = await updateMutation.mutateAsync({
                id: product.id,
                ...buildProductUpdatePayload(data, dirtyFields),
            })

            toast.success("Ürün güncellendi")
            onUpdated(updated)
        } catch {
            toast.error("Güncelleme başarısız")
        }
    }

    const filledLocales = PRODUCT_FORM_LOCALES.filter((locale) => {
        if (locale === PRODUCT_FORM_DEFAULT_LOCALE) return true
        const translation = watchedTranslations?.[productTranslationIndex(locale)]
        return Boolean(translation?.name?.trim())
    })

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tek kolon: tüm bölüm başlıkları alt alta hizalanır. */}
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
                                    <Input {...field} className="font-mono tabular-nums" />
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
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    <span className="font-mono tabular-nums text-xs text-neutral-500">
                                                        {cat.code}
                                                    </span>
                                                    {" · "}
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                                </Field>
                            )}
                        />
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
                        slugPreview={productSlug}
                    />
                </ProductFormSection>

                <ProductVideoLinksCard control={form.control} />

                <ProductFormSection
                    title="Medya"
                    description="Rolüne göre gruplanmış ürün dosyaları."
                >
                    <ProductAssetManager
                        product={product}
                        refetchProduct={async () => {
                            await refetchProduct()
                        }}
                    />
                </ProductFormSection>

                <ProductFormSection
                    title="Attribute alanları"
                    description="Kategoriye bağlı filtre attribute'ları. Sektör, üretim grubu ve kullanım alanı aşağıdaki bölümde yönetilir."
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
                        productSlug={productSlug}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        activeLocale={activeLocale}
                    />
                )}
            />

            <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur">
                <p className="mr-auto text-xs text-neutral-500">
                    Yüklenen görseller ve video linkleri yalnız kaydettikten sonra kalıcı olur.
                </p>
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
            </div>
        </form>
    )
}
