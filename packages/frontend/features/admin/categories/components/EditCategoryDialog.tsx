"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryAssetManager } from "./CategoryAssetManager";

import type { Category } from "@/features/public/categories/types";

type Props = {
    category: Category;
    onClose: () => void;
    onUpdated: (category: Category) => void;
};

export function EditCategoryDialog({ category: initialCategory, onClose, onUpdated }: Props) {
    const { data: session } = useSession();

    const [category, setCategory] = useState<Category>(initialCategory);
    const [name, setName] = useState(category.name);
    const [saving, setSaving] = useState(false);

    const authHeader = useMemo(() => {
        if (!session?.idToken) return null;
        return { Authorization: `Bearer ${session.idToken}` };
    }, [session?.idToken]);

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
        } catch (err) {
            console.error("refetch failed", err);
        }
    }, [authHeader, category.id, onUpdated]);

    const handleSave = async () => {
        if (!authHeader) return;

        try {
            setSaving(true);

            const res = await axios.put(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/${category.id}`,
                { name },
                { headers: authHeader }
            );

            const updated = res.data.payload.category;
            setCategory(updated);
            onUpdated(updated);
        } catch (err) {
            console.error(err);
            alert("Kategori güncellenemedi");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            {/* <DialogContent className="max-w-[92vw] w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8"> */}
            <DialogContent className="max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4 text-left">
                    <DialogTitle className="text-xl font-semibold">Kategori Yönetimi</DialogTitle>
                    <DialogDescription className="text-sm text-neutral-600">
                        Kategori bilgilerini ve asset&apos;lerini yönetebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT PANEL */}
                    <div className="col-span-3 space-y-4">

                        <div className="rounded-xl border p-4 bg-neutral-50 space-y-3">

                            <h3 className="font-medium text-sm">Kategori Bilgileri</h3>

                            <div className="space-y-2">
                                <div className="text-xs text-neutral-500">Kategori Adı</div>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Kaydediliyor..." : "Adı Kaydet"}
                            </Button>

                            <div className="text-xs text-neutral-500 space-y-1 pt-2">
                                <div>Kod: <b>{category.code}</b></div>
                                <div>Slug: <b>{category.slug}</b></div>
                                <div>Created: {new Date(category.createdAt).toLocaleDateString()}</div>
                                <div>Updated: {new Date(category.updatedAt).toLocaleDateString()}</div>
                            </div>

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