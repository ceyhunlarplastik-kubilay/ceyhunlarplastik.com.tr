"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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

import type { Category } from "@/features/public/categories/types";

type Props = {
    category: Category;
    onClose: () => void;
    onUpdated: (category: Category) => void;
};

/* -------------------------- */
/* ZOD */
/* -------------------------- */

const schema = z.object({
    name: z.string().min(2, "Kategori adı gerekli"),
});

type FormValues = z.infer<typeof schema>;

export function EditCategoryDialog({
    category: initialCategory,
    onClose,
    onUpdated,
}: Props) {
    const { data: session } = useSession();

    const [category, setCategory] = useState<Category>(initialCategory);
    const [saving, setSaving] = useState(false);
    const [allowedAttributeValueIds, setAllowedAttributeValueIds] = useState<string[]>(
        initialCategory.allowedAttributeValueIds ?? []
    );

    const authHeader = useMemo(() => {
        if (!session?.idToken) return null;
        return { Authorization: `Bearer ${session.idToken}` };
    }, [session?.idToken]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: category.name,
        },
    });

    const refetchCategory = useCallback(async () => {
        if (!authHeader) return;

        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/${category.id}`,
                { headers: authHeader }
            );

            const updated = res.data.payload.category;

            setCategory(updated);
            onUpdated(updated);
            form.reset({ name: updated.name });
            setAllowedAttributeValueIds(updated.allowedAttributeValueIds ?? []);
        } catch (err) {
            console.error(err);
            toast.error("Kategori yenilenemedi");
        }
    }, [authHeader, category.id, onUpdated, form]);

    const onSubmit = async (data: FormValues) => {
        if (!authHeader) return;

        try {
            setSaving(true);

            const res = await axios.put(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/${category.id}`,
                {
                    name: data.name,
                    allowedAttributeValueIds,
                },
                { headers: authHeader }
            );

            const updated = res.data.payload.category;

            setCategory(updated);
            setAllowedAttributeValueIds(updated.allowedAttributeValueIds ?? []);
            onUpdated(updated);

            toast.success("Kategori güncellendi");
        } catch (err) {
            console.error(err);
            toast.error("Kategori güncellenemedi");
        } finally {
            setSaving(false);
        }
    };

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
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="rounded-xl border p-4 bg-neutral-50 space-y-3"
                        >

                            <h3 className="font-medium text-sm">
                                Kategori Bilgileri
                            </h3>

                            <div className="space-y-2">

                                <div className="text-xs text-neutral-500">
                                    Kategori Adı
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

                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Kaydediliyor..." : "Adı Kaydet"}
                            </Button>

                            <div className="text-xs text-neutral-500 space-y-1 pt-2">

                                <div>
                                    Kod: <b>{category.code}</b>
                                </div>

                                <div>
                                    Slug: <b>{category.slug}</b>
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
                            <h3 className="font-medium text-sm">İzinli Attribute Değerleri</h3>
                            <ProductAttributeSelect
                                value={allowedAttributeValueIds}
                                onChange={setAllowedAttributeValueIds}
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
