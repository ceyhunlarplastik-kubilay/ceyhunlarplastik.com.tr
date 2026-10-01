"use client";

import Image from "next/image";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

import {
    Pencil,
    Trash2,
    Image as ImageIcon,
    Film,
    FileText,
} from "lucide-react";

import { EditCategoryDialog } from "@/features/admin/categories/components/EditCategoryDialog";
import { CategoryCreateForm } from "@/features/admin/categories/components/CategoryCreateForm";
import {
    ConfirmDeleteDialog,
    PERMANENT_DELETE_CONFIRMATION,
} from "@/features/admin/shared/components/ConfirmDeleteDialog";

import { useDeleteCategory } from "@/features/admin/categories/hooks/useDeleteCategory";

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
    const deleteMutation = useDeleteCategory();

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <CategoryCreateForm />
            </div>

            {/* TABLE */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[90px]">Kod</TableHead>
                            <TableHead>Ad</TableHead>
                            <TableHead className="w-[130px]">Diller</TableHead>
                            <TableHead className="w-[180px]">Asset</TableHead>
                            <TableHead className="w-[120px]">Oluşturulma</TableHead>
                            <TableHead className="w-[120px]">Güncellenme</TableHead>
                            <TableHead className="text-right w-[140px]">
                                İşlemler
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {categories.map((category) => {
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
                                        <div className="flex flex-wrap gap-1">
                                            <Badge variant="secondary">TR</Badge>
                                            <Badge
                                                variant={category.alternateSlugs.en ? "secondary" : "outline"}
                                                className={category.alternateSlugs.en ? undefined : "text-neutral-500"}
                                            >
                                                {category.alternateSlugs.en ? "EN" : "EN eksik"}
                                            </Badge>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                                {thumb ? (
                                                    <Image
                                                        src={thumb}
                                                        className="h-full w-full object-cover"
                                                        alt={category.name}
                                                        width={40}
                                                        height={40}
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

                                        {/* Silme kaskad çalışır (ürün modelleri, varyantlar, çeviriler,
                                            görseller): tarayıcı onayı yerine ne gideceğini anlatan ve
                                            ifadeyi yazdıran ortak diyalog. */}
                                        <ConfirmDeleteDialog
                                            trigger={
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    aria-label={`${category.name} kategorisini sil`}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            }
                                            title={`“${category.code} · ${category.name}” kategorisi silinsin mi?`}
                                            description={
                                                <>
                                                    Bu işlem geri alınamaz. Kategorinin çevirileri ve görselleri
                                                    ile bu kategorideki <strong>tüm ürün modelleri ve
                                                    varyantları</strong> da kalıcı olarak silinir.
                                                </>
                                            }
                                            confirmationPhrase={PERMANENT_DELETE_CONFIRMATION}
                                            confirmLabel="Kategoriyi sil"
                                            onConfirm={() => deleteMutation.mutate({ id: category.id })}
                                        />

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
                    onUpdated={() => {
                        setEditingCategory(null)
                    }}
                />
            )}

        </div>
    );
}
