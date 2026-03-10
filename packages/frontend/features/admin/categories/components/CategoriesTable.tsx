"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import slugify from "slugify";
import { Category } from "@/features/public/categories/types";
import type { AssetRole, AssetType } from "@/features/public/assets/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Image as ImageIcon, Film, FileText } from "lucide-react";
import { useSession } from "next-auth/react";

import { EditCategoryDialog } from "@/features/admin/categories/components/EditCategoryDialog";

type Props = {
    initialData: Category[];
};

function getAcceptByType(assetType: AssetType) {
    switch (assetType) {
        case "IMAGE":
            return "image/*";
        case "VIDEO":
            return "video/*";
        case "PDF":
            return "application/pdf";
        case "TECHNICAL_DRAWING":
            return ".dwg,.dxf,.pdf";
        case "CERTIFICATE":
            return "application/pdf,image/*";
        default:
            return "*";
    }
}

function pickThumb(category: Category) {
    // Öncelik: PRIMARY → ANIMATION → ilk IMAGE
    const primary = category.assets?.find((a) => a.role === "PRIMARY" && a.type === "IMAGE");
    if (primary?.url) return primary.url;

    const anim = category.assets?.find((a) => a.role === "ANIMATION" && a.type === "IMAGE");
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

export function CategoriesTable({ initialData }: Props) {
    const { data: session } = useSession();

    const [categories, setCategories] = useState<Category[]>(initialData);

    const [code, setCode] = useState("");
    const [name, setName] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const [loadingCreate, setLoadingCreate] = useState(false);

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [assetType, setAssetType] = useState<AssetType>("IMAGE");
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY");

    const accept = useMemo(() => getAcceptByType(assetType), [assetType]);

    const handleCreate = async () => {
        if (!session?.idToken) return alert("Unauthorized");
        if (!code || !name.trim()) return alert("Kod ve ad gerekli");

        try {
            setLoadingCreate(true);

            let assetKey: string | undefined;
            let mimeType: string | undefined;

            if (file) {
                const slug = slugify(name, { lower: true, strict: true, locale: "tr" });

                const presignRes = await axios.post(
                    `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/assets/presign`,
                    {
                        categorySlug: slug,
                        assetRole, // ✅ role bazlı klasörleme
                        fileName: file.name,
                        contentType: file.type,
                    },
                    {
                        headers: { Authorization: `Bearer ${session.idToken}` },
                    }
                );

                const { uploadUrl, key } = presignRes.data.payload;

                await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                assetKey = key;
                mimeType = file.type;
            }

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories`,
                {
                    code: Number(code),
                    name,
                    assetType,
                    assetRole,
                    assetKey,
                    mimeType,
                },
                {
                    headers: { Authorization: `Bearer ${session.idToken}` },
                }
            );

            setCategories((prev) => [...prev, res.data.payload.category]);
            setCode("");
            setName("");
            setFile(null);
        } catch (err) {
            console.error(err);
            alert("Kategori oluşturulamadı");
        } finally {
            setLoadingCreate(false);
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (!session?.idToken) return alert("Unauthorized");

        const ok = window.confirm(
            `“${category.name}” kategorisini silmek istediğine emin misin?\nBu işlem geri alınamaz.`
        );
        if (!ok) return;

        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/${category.id}`,
                { headers: { Authorization: `Bearer ${session.idToken}` } }
            );

            setCategories((prev) => prev.filter((c) => c.id !== category.id));
        } catch (err) {
            console.error(err);
            alert("Kategori silinemedi");
        }
    };

    return (
        <div className="space-y-6">
            {/* CREATE FORM */}
            <div className="rounded-xl border p-6 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Yeni Kategori</h2>
                    <div className="text-xs text-muted-foreground">
                        Upload → Presign → S3 PUT → Category create/update ile Asset kaydı
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                    <Input
                        placeholder="Kod (ör: 1)"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="lg:col-span-1"
                    />
                    <Input
                        placeholder="Ad (ör: Bakalit Tutamaklar)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="lg:col-span-2"
                    />

                    <select
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as AssetType)}
                        className="border rounded px-3 py-2 lg:col-span-1 bg-background"
                    >
                        <option value="IMAGE">Resim</option>
                        <option value="VIDEO">Video</option>
                        <option value="PDF">PDF</option>
                        <option value="TECHNICAL_DRAWING">Teknik Çizim</option>
                        <option value="CERTIFICATE">Sertifika</option>
                    </select>

                    <select
                        value={assetRole}
                        onChange={(e) => setAssetRole(e.target.value as AssetRole)}
                        className="border rounded px-3 py-2 lg:col-span-1 bg-background"
                    >
                        <option value="PRIMARY">Primary</option>
                        <option value="ANIMATION">Animation</option>
                        <option value="GALLERY">Gallery</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="TECHNICAL_DRAWING">Technical Drawing</option>
                        <option value="CERTIFICATE">Certificate</option>
                    </select>

                    <Input
                        type="file"
                        accept={accept}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="lg:col-span-1"
                    />
                </div>

                <Button onClick={handleCreate} disabled={loadingCreate}>
                    {loadingCreate ? "Yükleniyor..." : "Oluştur"}
                </Button>
            </div>

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
                            <TableHead className="text-right w-[140px]">İşlemler</TableHead>
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
                                            <span className="text-xs text-muted-foreground">{category.slug}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                                {thumb ? (
                                                    // admin table için <img> yeterli
                                                    <img src={thumb} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <ImageIcon className="h-3 w-3" /> {counts.images}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Film className="h-3 w-3" /> {counts.videos}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> {counts.pdfs}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(category.updatedAt).toLocaleDateString()}</TableCell>

                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingCategory(category)}
                                            title="Düzenle"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteCategory(category)}
                                            title="Sil"
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

            {editingCategory && (
                <EditCategoryDialog
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onUpdated={(updated) => {
                        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    }}
                />
            )}
        </div>
    );
}