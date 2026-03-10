"use client";

import { useState, useEffect } from "react";
import { Category } from "@/features/public/categories/types";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import {
    Pencil,
    Trash2,
    Image as ImageIcon,
    Film,
    FileText,
} from "lucide-react";

import { EditCategoryDialog } from "@/features/admin/categories/components/EditCategoryDialog";
import { CategoryCreateForm } from "@/features/admin/categories/components/CategoryCreateForm";

import { useDeleteCategory } from "@/features/admin/categories/hooks/useDeleteCategory";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Props = {
    categories: Category[];
};

function pickThumb(category: Category) {
    const primary = category.assets?.find(
        (a) => a.role === "PRIMARY" && a.type === "IMAGE"
    );
    if (primary?.url) return primary.url;

    const anim = category.assets?.find(
        (a) => a.role === "ANIMATION" && a.type === "IMAGE"
    );
    if (anim?.url) return anim.url;

    const anyImg = category.assets?.find((a) => a.type === "IMAGE");
    return anyImg?.url ?? null;
}

function countByType(category: Category) {
    const assets = category.assets ?? [];

    return {
        images: assets.filter((a) => a.type === "IMAGE").length,
        videos: assets.filter((a) => a.type === "VIDEO").length,
        pdfs: assets.filter((a) => a.type === "PDF").length,
    };
}

export function CategoriesTable({ categories }: Props) {
    const { data: session } = useSession();
    const deleteMutation = useDeleteCategory();

    const [items, setItems] = useState<Category[]>(categories);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    /** React Query refetch ederse tablo güncellenir */
    useEffect(() => {
        setItems(categories);
    }, [categories]);

    const handleDelete = (category: Category) => {
        if (!session?.idToken) {
            toast.error("Unauthorized");
            return;
        }

        const ok = window.confirm(
            `“${category.name}” kategorisini silmek istediğine emin misin?\nBu işlem geri alınamaz.`
        );

        if (!ok) return;

        deleteMutation.mutate(
            {
                id: category.id,
            },
            {
                onSuccess() {
                    setItems((prev) => prev.filter((c) => c.id !== category.id));
                },
            }
        );
    };

    return (
        <div className="space-y-6">

            {/* CREATE FORM */}
            <CategoryCreateForm
                onCreated={(category) => {
                    setItems((prev) => [...prev, category]);
                }}
            />

            {/* TABLE */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[90px]">Kod</TableHead>
                            <TableHead>Ad</TableHead>
                            <TableHead className="w-[180px]">Asset</TableHead>
                            <TableHead className="w-[120px]">Oluşturulma</TableHead>
                            <TableHead className="w-[120px]">Güncellenme</TableHead>
                            <TableHead className="text-right w-[140px]">
                                İşlemler
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {items.map((category) => {
                            const thumb = pickThumb(category);
                            const counts = countByType(category);

                            return (
                                <TableRow key={category.id}>
                                    <TableCell>{category.code}</TableCell>

                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{category.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {category.slug}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">

                                                <span className="inline-flex items-center gap-1">
                                                    <ImageIcon className="h-3 w-3" />
                                                    {counts.images}
                                                </span>

                                                <span className="inline-flex items-center gap-1">
                                                    <Film className="h-3 w-3" />
                                                    {counts.videos}
                                                </span>

                                                <span className="inline-flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {counts.pdfs}
                                                </span>

                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        {new Date(category.createdAt).toLocaleDateString()}
                                    </TableCell>

                                    <TableCell>
                                        {new Date(category.updatedAt).toLocaleDateString()}
                                    </TableCell>

                                    <TableCell className="text-right space-x-2">

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingCategory(category)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(category)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* EDIT DIALOG */}
            {editingCategory && (
                <EditCategoryDialog
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onUpdated={(updated) => {
                        setItems((prev) =>
                            prev.map((c) => (c.id === updated.id ? updated : c))
                        );
                    }}
                />
            )}

        </div>
    );
}