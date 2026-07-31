"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CategoryAssetManager } from "./CategoryAssetManager";
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect";
import { useUpdateCategory } from "@/features/admin/categories/hooks/useUpdateCategory";
import { buildCategoryTranslationUpdatePayload } from "@/features/admin/categories/utils/buildCategoryTranslationUpdatePayload";
import { AdminTranslatedNameSection } from "@/features/admin/shared/translations/AdminTranslatedNameSection";
import {
    ADMIN_DEFAULT_LOCALE,
    adminLocaleLabel,
    type AdminLocale,
} from "@/features/admin/shared/translations/adminLocales";
import {
    buildNameTranslationDefaults,
    nameTranslationFormSchema,
} from "@/features/admin/shared/translations/nameTranslations";

import type { Category } from "@/features/public/categories/types";
import { normalizeCategory } from "@/features/public/categories/normalizeCategory";

type Props = {
    category: Category;
    onClose: () => void;
    onUpdated: (category: Category) => void;
};

const PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"];

/* -------------------------- */
/* ZOD */
/* -------------------------- */

const schema = z.object({
    name: z.string().min(2, "Kategori adı gerekli"),
    translations: z.array(nameTranslationFormSchema),
});

type FormValues = z.infer<typeof schema>;

export function EditCategoryDialog({
    category: initialCategory,
    onClose,
    onUpdated,
}: Props) {
    const { data: session } = useSession();
    const updateCategoryMutation = useUpdateCategory();

    const [category, setCategory] = useState<Category>(initialCategory);
    const [saving, setSaving] = useState(false);
    const [allowedAttributeValueIds, setAllowedAttributeValueIds] = useState<string[]>(
        initialCategory.allowedAttributeValueIds ?? []
    );
    const [savedAllowedAttributeValueIds, setSavedAllowedAttributeValueIds] = useState<string[]>(
        initialCategory.allowedAttributeValueIds ?? []
    );
    const [activeLocale, setActiveLocale] = useState<AdminLocale>(ADMIN_DEFAULT_LOCALE);

    const authHeader = useMemo(() => {
        if (!session?.idToken) return null;
        return { Authorization: `Bearer ${session.idToken}` };
    }, [session?.idToken]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: category.name,
            translations: buildNameTranslationDefaults(category.translations),
        },
    });

    // RHF'in formState'i bir Proxy: abonelik yalnız RENDER sırasında okunan
    // alanlar için kurulur. `dirtyFields`'ı sadece submit callback'i içinde
    // okursak boş gelir ve hiçbir şey gönderilmez — ürün formunda pahalıya
    // öğrenilen ders.
    const { dirtyFields, isDirty } = form.formState;

    const refetchCategory = useCallback(async () => {
        if (!authHeader) return;

        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/${category.id}`,
                { headers: authHeader }
            );

            const updated = normalizeCategory(res.data.payload.category, "tr");

            setCategory(updated);
            onUpdated(updated);
            form.reset({
                name: updated.name,
                translations: buildNameTranslationDefaults(updated.translations),
            });
            const updatedAllowedAttributeValueIds = updated.allowedAttributeValueIds ?? []
            setAllowedAttributeValueIds(updatedAllowedAttributeValueIds);
            setSavedAllowedAttributeValueIds(updatedAllowedAttributeValueIds);
        } catch (err) {
            console.error(err);
            toast.error("Kategori yenilenemedi");
        }
    }, [authHeader, category.id, onUpdated, form]);

    const hasAttributeChanges = useMemo(() => {
        const initial = [...savedAllowedAttributeValueIds].sort()
        const current = [...allowedAttributeValueIds].sort()

        if (initial.length !== current.length) return true
        return initial.some((valueId, index) => valueId !== current[index])
    }, [allowedAttributeValueIds, savedAllowedAttributeValueIds])

    const saveTranslations = async (data: FormValues) => {
        const payload = buildCategoryTranslationUpdatePayload({
            name: data.name,
            nameChanged: Boolean(dirtyFields.name),
            translations: data.translations,
            existingTranslations: category.translations,
        })

        // Değişen hiçbir şey yoksa istek atma: aynı dialog'daki attribute
        // kaydetmesini de tetikleyecek gereksiz bir yazma olurdu.
        if (Object.keys(payload).length === 0) return

        try {
            setSaving(true);
            const updated = await updateCategoryMutation.mutateAsync({
                id: category.id,
                ...payload,
            })

            setCategory(updated);
            onUpdated(updated);
            form.reset({
                name: updated.name,
                translations: buildNameTranslationDefaults(updated.translations),
            });

            toast.success("Kategori çevirileri güncellendi");
        } catch (err) {
            console.error(err);
            toast.error("Kategori çevirileri güncellenemedi");
        } finally {
            setSaving(false);
        }
    };

    const saveAttributeValues = async () => {
        if (!hasAttributeChanges) return

        try {
            setSaving(true)

            const updated = await updateCategoryMutation.mutateAsync({
                id: category.id,
                allowedAttributeValueIds,
            })
            const updatedAllowedAttributeValueIds = updated.allowedAttributeValueIds ?? []

            setCategory(updated)
            setAllowedAttributeValueIds(updatedAllowedAttributeValueIds)
            setSavedAllowedAttributeValueIds(updatedAllowedAttributeValueIds)
            onUpdated(updated)
            toast.success("İzinli attribute değerleri güncellendi")
        } catch (err) {
            console.error(err)
            toast.error("İzinli attribute değerleri güncellenemedi")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4 text-left">
                    <DialogTitle className="text-xl font-semibold">
                        Kategori Yönetimi
                    </DialogTitle>

                    <DialogDescription className="text-sm text-neutral-600">
                        Kategori bilgilerini ve asset&apos;lerini yönetebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT PANEL */}

                    <div className="col-span-3 space-y-4">

                        <form
                            onSubmit={form.handleSubmit(saveTranslations)}
                            className="rounded-xl border p-4 bg-neutral-50 space-y-3"
                        >

                            <h3 className="font-medium text-sm">
                                Kategori Bilgileri
                            </h3>

                            <Controller
                                name="translations"
                                control={form.control}
                                render={({ field }) => (
                                    <AdminTranslatedNameSection
                                        entityLabel="Kategori adı"
                                        activeLocale={activeLocale}
                                        onActiveLocaleChange={setActiveLocale}
                                        translations={field.value}
                                        onTranslationsChange={field.onChange}
                                        targetPlaceholder="örn. Bakelite Handles"
                                        defaultLocaleField={
                                            <div className="space-y-2">
                                                <div className="text-xs text-neutral-500">
                                                    Türkçe kategori adı
                                                </div>

                                                <Input {...form.register("name")} />

                                                {form.formState.errors.name && (
                                                    <p className="text-xs text-red-500">
                                                        {form.formState.errors.name.message}
                                                    </p>
                                                )}
                                            </div>
                                        }
                                    />
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={saving || !isDirty}
                                className="w-full"
                            >
                                {saving ? "Kaydediliyor..." : "Çevirileri Kaydet"}
                            </Button>

                            <div className="text-xs text-neutral-500 space-y-1 pt-2">

                                <div>
                                    Kod: <b>{category.code}</b>
                                </div>

                                <div>
                                    Slug: <b>{category.slug}</b>
                                </div>

                                {activeLocale !== ADMIN_DEFAULT_LOCALE && (
                                    <div>
                                        {adminLocaleLabel(activeLocale)} slug:{" "}
                                        <b>{category.alternateSlugs[activeLocale] ?? "Eksik"}</b>
                                    </div>
                                )}

                                <div>
                                    Created: {new Date(category.createdAt).toLocaleDateString()}
                                </div>

                                <div>
                                    Updated: {new Date(category.updatedAt).toLocaleDateString()}
                                </div>

                            </div>

                        </form>

                        <div className="rounded-xl border p-4 bg-neutral-50 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-medium text-sm">İzinli Attribute Değerleri</h3>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Kategori altında açılabilecek ürünlerin seçebileceği değerleri yönetin.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => void saveAttributeValues()}
                                    disabled={saving || !hasAttributeChanges}
                                    className="shrink-0 gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Güncelle
                                </Button>
                            </div>

                            <ProductAttributeSelect
                                value={allowedAttributeValueIds}
                                onChange={setAllowedAttributeValueIds}
                                singleSelectNonHierarchy={false}
                                excludeAttributeCodes={PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES}
                            />
                        </div>

                    </div>

                    {/* RIGHT PANEL */}

                    <div className="col-span-9">
                        <CategoryAssetManager
                            category={category}
                            authHeader={authHeader}
                            onCategoryChanged={(updated) => {
                                setCategory(updated);
                                onUpdated(updated);
                            }}
                            refetchCategory={refetchCategory}
                        />
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
