"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { useForm } from "react-hook-form";
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
    englishName: z.string().max(100, "İngilizce kategori adı en fazla 100 karakter olabilir"),
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
    const englishTranslation = category.translations.find(
        (translation) => translation.locale === "en",
    )

    const authHeader = useMemo(() => {
        if (!session?.idToken) return null;
        return { Authorization: `Bearer ${session.idToken}` };
    }, [session?.idToken]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: category.name,
            englishName: englishTranslation?.name ?? "",
        },
    });

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
                englishName: updated.translations.find(
                    (translation: Category["translations"][number]) => translation.locale === "en",
                )?.name ?? "",
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
        const { dirtyFields } = form.formState
        if (!dirtyFields.name && !dirtyFields.englishName) return

        try {
            setSaving(true);
            const hasEnglishTranslation = category.translations.some(
                (translation) => translation.locale === "en",
            )
            const payload = buildCategoryTranslationUpdatePayload({
                name: data.name,
                englishName: data.englishName,
                nameChanged: Boolean(dirtyFields.name),
                englishNameChanged: Boolean(dirtyFields.englishName),
                hasEnglishTranslation,
            })

            const updated = await updateCategoryMutation.mutateAsync({
                id: category.id,
                ...payload,
            })

            setCategory(updated);
            onUpdated(updated);
            form.reset({
                name: updated.name,
                englishName: updated.translations.find(
                    (translation: Category["translations"][number]) => translation.locale === "en",
                )?.name ?? "",
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

                            <div className="space-y-2">

                                <div className="text-xs text-neutral-500">
                                    Kategori Adı (TR)
                                </div>

                                <Input
                                    {...form.register("name")}
                                />

                                {form.formState.errors.name && (
                                    <p className="text-xs text-red-500">
                                        {form.formState.errors.name.message}
                                    </p>
                                )}

                            </div>

                            <div className="space-y-2">
                                <div className="text-xs text-neutral-500">
                                    Kategori Adı (EN)
                                </div>

                                <Input {...form.register("englishName")} />

                                {form.formState.errors.englishName && (
                                    <p className="text-xs text-red-500">
                                        {form.formState.errors.englishName.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={saving || !form.formState.isDirty}
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

                                <div>
                                    EN Slug: <b>{category.alternateSlugs.en ?? "Eksik"}</b>
                                </div>

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
