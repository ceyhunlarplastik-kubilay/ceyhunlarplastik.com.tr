"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import slugify from "slugify";
import { Copy, ExternalLink, Trash2, Image as ImageIcon, Film, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { Category } from "@/features/public/categories/types";
import type { Asset, AssetRole, AssetType } from "@/features/public/assets/types";

type Props = {
    category: Category;
    authHeader: Record<string, string> | null;
    onCategoryChanged: (category: Category) => void;
    refetchCategory: () => Promise<void>;
};

const ROLE_TABS: AssetRole[] = [
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
];

const TYPE_OPTIONS: AssetType[] = [
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
];

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

function roleLabel(role: AssetRole) {
    switch (role) {
        case "PRIMARY":
            return "Primary";
        case "ANIMATION":
            return "Animation";
        case "GALLERY":
            return "Gallery";
        case "DOCUMENT":
            return "Document";
        case "TECHNICAL_DRAWING":
            return "Technical Drawing";
        case "CERTIFICATE":
            return "Certificate";
        default:
            return role;
    }
}

function typeIcon(type: AssetType) {
    if (type === "IMAGE") return <ImageIcon className="h-4 w-4" />;
    if (type === "VIDEO") return <Film className="h-4 w-4" />;
    if (type === "PDF") return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
}

function isPreviewableImage(asset: Asset) {
    return asset.type === "IMAGE";
}
function isPreviewableVideo(asset: Asset) {
    return asset.type === "VIDEO";
}
function isPreviewablePdf(asset: Asset) {
    return asset.type === "PDF";
}

export function CategoryAssetManager({
    category,
    authHeader,
    onCategoryChanged,
    refetchCategory,
}: Props) {
    const [activeRole, setActiveRole] = useState<AssetRole>("PRIMARY");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Upload state
    const [assetType, setAssetType] = useState<AssetType>("IMAGE");
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const assets = category.assets ?? [];

    const assetsByRole = useMemo(() => {
        const map = new Map<AssetRole, Asset[]>();
        for (const r of ROLE_TABS) map.set(r, []);
        for (const a of assets) {
            const list = map.get(a.role as AssetRole);
            if (list) list.push(a);
        }
        // her role içinde newest-first
        for (const r of ROLE_TABS) {
            const list = map.get(r)!;
            list.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
        }
        return map;
    }, [assets]);

    const visibleAssets = assetsByRole.get(activeRole) ?? [];

    const selectedAsset = useMemo(() => {
        if (!selectedId) return null;
        return assets.find((a) => a.id === selectedId) ?? null;
    }, [assets, selectedId]);

    useEffect(() => {
        // role değiştiyse ve listede item varsa ilkini seç
        if (visibleAssets.length && !visibleAssets.some((a) => a.id === selectedId)) {
            setSelectedId(visibleAssets[0].id);
        }
        if (!visibleAssets.length) setSelectedId(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRole, category.id]);

    const accept = useMemo(() => getAcceptByType(assetType), [assetType]);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // fallback
            window.prompt("Copy this:", text);
        }
    };

    const ensureAuth = () => {
        if (!authHeader) {
            alert("Unauthorized");
            return false;
        }
        return true;
    };

    const handleDeleteAsset = async (asset: Asset) => {
        if (!ensureAuth()) return;

        const ok = window.confirm(
            `Asset silinsin mi?\nRole: ${asset.role}\nType: ${asset.type}\nBu işlem geri alınamaz.`
        );
        if (!ok) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/assets/${asset.id}`, {
                headers: authHeader!,
            });
            await refetchCategory();
        } catch (err) {
            console.error(err);
            alert("Asset silinemedi");
        }
    };

    const handleChangeRole = async (asset: Asset, newRole: AssetRole) => {
        if (!ensureAuth()) return;

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/assets/${asset.id}`,
                { role: newRole },
                { headers: authHeader! }
            );
            await refetchCategory();
            setActiveRole(newRole);
            setSelectedId(asset.id);
        } catch (err) {
            console.error(err);
            alert("Role güncellenemedi (backend updateAsset role desteklemiyor olabilir)");
        }
    };

    const handleUploadNew = async () => {
        if (!ensureAuth()) return;
        if (!file) return alert("Dosya seçmelisin");

        try {
            setUploading(true);

            // slug: name değişmiş olabilir, o yüzden payload’daki name’i baz al
            const slug = slugify(category.name, { lower: true, strict: true, locale: "tr" });

            // 1) presign
            const presignRes = await axios.post(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/assets/presign`,
                {
                    categorySlug: slug,
                    assetRole, // klasörü role belirliyor
                    fileName: file.name,
                    contentType: file.type,
                },
                { headers: authHeader! }
            );

            const { uploadUrl, key } = presignRes.data.payload;

            // 2) S3 PUT
            await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            // 3) DB kaydı (senin updateCategory handler bunu createAsset yapıyor)
            await axios.put(
                `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/categories/${category.id}`,
                {
                    assetType,
                    assetRole,
                    assetKey: key,
                    mimeType: file.type,
                },
                { headers: authHeader! }
            );

            // 4) refetch
            await refetchCategory();

            // reset
            setFile(null);
            setActiveRole(assetRole);
        } catch (err) {
            console.error(err);
            alert("Upload başarısız");
        } finally {
            setUploading(false);
        }
    };

    // selected preview url for local file
    const localPreviewUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        };
    }, [localPreviewUrl]);

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold">Asset Manager</div>
                    <div className="text-xs text-muted-foreground">
                        Role bazlı yönetim • Preview • Role change • Delete • Upload
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={refetchCategory}
                    disabled={!authHeader}
                >
                    Yenile
                </Button>
            </div>


            {/* ROLE TABS */}
            <div className="flex flex-wrap gap-2">
                {ROLE_TABS.map((role) => {

                    const count = assetsByRole.get(role)?.length ?? 0

                    return (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`
              px-3 py-1.5
              rounded-full
              text-xs
              border
              transition
              ${activeRole === role
                                    ? "bg-black text-white"
                                    : "bg-white hover:bg-neutral-100"
                                }
            `}
                        >
                            {roleLabel(role)} ({count})
                        </button>
                    )
                })}
            </div>



            {/* MAIN GRID */}
            <div className="grid grid-cols-12 gap-6">

                {/* ASSET GRID */}
                <div className="col-span-7 border rounded-xl p-4 bg-white">

                    <div className="text-sm font-medium pb-3">
                        {roleLabel(activeRole)} Assets
                    </div>

                    {visibleAssets.length === 0 && (
                        <div className="border border-dashed rounded-lg p-6 text-sm text-muted-foreground text-center">
                            Bu role için asset yok
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">

                        {visibleAssets.map((asset) => {

                            const selected = asset.id === selectedId

                            return (
                                <button
                                    key={asset.id}
                                    onClick={() => setSelectedId(asset.id)}
                                    className={`
                  rounded-lg
                  border
                  overflow-hidden
                  transition
                  ${selected ? "ring-2 ring-black" : ""}
                `}
                                >

                                    <div className="h-24 w-full bg-muted flex items-center justify-center">

                                        {isPreviewableImage(asset) && (
                                            <img
                                                src={asset.url}
                                                className="h-full w-full object-cover"
                                            />
                                        )}

                                        {isPreviewableVideo(asset) && (
                                            <Film className="h-5 w-5 text-muted-foreground" />
                                        )}

                                        {isPreviewablePdf(asset) && (
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        )}

                                    </div>

                                </button>
                            )
                        })}

                    </div>

                </div>



                {/* PREVIEW PANEL */}
                <div className="col-span-5 border rounded-xl p-4 bg-white space-y-4">

                    <div className="text-sm font-medium">
                        Detay / Önizleme
                    </div>

                    {!selectedAsset && (
                        <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                            Asset seç
                        </div>
                    )}

                    {selectedAsset && (
                        <>

                            {/* PREVIEW */}
                            <div className="border rounded-lg overflow-hidden bg-muted flex justify-center">

                                {isPreviewableImage(selectedAsset) && (
                                    <img
                                        src={selectedAsset.url}
                                        className="max-h-[260px] w-full object-contain bg-white"
                                    />
                                )}

                                {isPreviewableVideo(selectedAsset) && (
                                    <video
                                        src={selectedAsset.url}
                                        controls
                                        className="max-h-[260px] w-full"
                                    />
                                )}

                                {isPreviewablePdf(selectedAsset) && (
                                    <div className="p-6 text-sm text-muted-foreground">
                                        PDF preview için “Aç” kullan
                                    </div>
                                )}

                            </div>


                            {/* META */}
                            <div className="text-xs text-muted-foreground space-y-1">

                                <div>
                                    Role: <b>{selectedAsset.role}</b>
                                </div>

                                <div>
                                    Mime: {selectedAsset.mimeType}
                                </div>

                                <div>
                                    Created: {new Date(selectedAsset.createdAt).toLocaleString()}
                                </div>

                            </div>


                            {/* ACTIONS */}
                            <div className="flex flex-wrap gap-2">

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(selectedAsset.url)}
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Aç
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copy(selectedAsset.url)}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    URL Kopyala
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteAsset(selectedAsset)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Sil
                                </Button>

                            </div>


                            {/* ROLE CHANGE */}
                            <div className="border rounded-lg p-3 space-y-2">

                                <div className="text-xs font-medium flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Role Değiştir
                                </div>

                                <div className="flex flex-wrap gap-2">

                                    {ROLE_TABS.map((r) => (

                                        <Button
                                            key={r}
                                            size="sm"
                                            variant={selectedAsset.role === r ? "default" : "outline"}
                                            onClick={() => handleChangeRole(selectedAsset, r)}
                                            disabled={!authHeader}
                                        >
                                            {roleLabel(r)}
                                        </Button>

                                    ))}

                                </div>

                            </div>

                        </>
                    )}

                </div>

            </div>



            {/* UPLOAD */}
            <div className="border rounded-xl p-4 bg-neutral-50 space-y-4">

                <div className="text-sm font-semibold">
                    Yeni Asset Yükle
                </div>

                <div className="grid grid-cols-4 gap-3">

                    <select
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as AssetType)}
                        className="border rounded px-3 py-2"
                    >
                        {TYPE_OPTIONS.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        value={assetRole}
                        onChange={(e) => setAssetRole(e.target.value as AssetRole)}
                        className="border rounded px-3 py-2"
                    >
                        {ROLE_TABS.map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </select>

                    <Input
                        type="file"
                        accept={accept}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />

                    <Button
                        onClick={handleUploadNew}
                        disabled={!authHeader || uploading || !file}
                    >
                        {uploading ? "Yükleniyor..." : "Upload"}
                    </Button>

                </div>

            </div>

        </div>
    )
}