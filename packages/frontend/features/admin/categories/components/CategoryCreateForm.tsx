"use client";

import { useMemo, useState } from "react";
import slugify from "slugify";
import axios from "axios";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateCategory } from "../hooks/useCreateCategory";
import { presignCategoryAsset } from "../api/presignCategoryAsset";

import type { AssetRole, AssetType } from "@/features/public/assets/types";
import type { Category } from "@/features/public/categories/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Props = {
    onCreated: (category: Category) => void;
};

const schema = z.object({
    code: z.number().int().positive("Kod pozitif olmalı"),
    name: z.string().min(2, "Kategori adı gerekli"),
});

type FormValues = z.infer<typeof schema>;

function getAcceptByType(assetType: AssetType) {
    switch (assetType) {
        case "IMAGE":
            return "image/*";
        case "VIDEO":
            return "video/*";
        case "PDF":
            return "application/pdf";
        default:
            return "*";
    }
}

export function CategoryCreateForm({ onCreated }: Props) {

    const createMutation = useCreateCategory()

    const [file, setFile] = useState<File | null>(null);
    const [assetType, setAssetType] = useState<AssetType>("IMAGE");
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY");

    const [uploadProgress, setUploadProgress] = useState(0);

    const accept = useMemo(
        () => getAcceptByType(assetType),
        [assetType]
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {

        let assetKey: string | undefined;
        let mimeType: string | undefined;

        if (file) {

            const slug = slugify(
                data.name,
                { lower: true, strict: true, locale: "tr" }
            );

            const presigned = await presignCategoryAsset({
                categorySlug: slug,
                assetRole,
                fileName: file.name,
                contentType: file.type,
            });

            await axios.put(presigned.uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
                onUploadProgress: (e) => {
                    const percent = Math.round(
                        (e.loaded * 100) / (e.total || 1)
                    );
                    setUploadProgress(percent);
                },
            });

            assetKey = presigned.key;
            mimeType = file.type;
        }

        const category = await createMutation.mutateAsync({
            code: data.code,
            name: data.name,
            assetType,
            assetRole,
            assetKey,
            mimeType,
        });

        onCreated(category);

        form.reset();
        setFile(null);
        setUploadProgress(0);
    };

    return (

        <div className="rounded-xl border p-6 bg-white shadow-sm space-y-4">

            <h2 className="text-lg font-semibold">
                Yeni Kategori
            </h2>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 lg:grid-cols-6 gap-3"
            >

                <Input
                    type="number"
                    {...form.register("code", { valueAsNumber: true })}
                />

                <Input
                    placeholder="Ad"
                    {...form.register("name")}
                />

                <select
                    value={assetType}
                    onChange={(e) =>
                        setAssetType(e.target.value as AssetType)
                    }
                    className="border rounded px-3 py-2"
                >
                    <option value="IMAGE">Resim</option>
                    <option value="VIDEO">Video</option>
                    <option value="PDF">PDF</option>
                </select>

                <select
                    value={assetRole}
                    onChange={(e) =>
                        setAssetRole(e.target.value as AssetRole)
                    }
                    className="border rounded px-3 py-2"
                >
                    <option value="PRIMARY">Primary</option>
                    <option value="ANIMATION">Animation</option>
                    <option value="GALLERY">Gallery</option>
                </select>

                <Input
                    type="file"
                    accept={accept}
                    onChange={(e) =>
                        setFile(e.target.files?.[0] ?? null)
                    }
                />

                <Button
                    type="submit"
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? "Yükleniyor..." : "Oluştur"}
                </Button>

            </form>

            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="pt-2">
                    <Progress value={uploadProgress} />
                    <div className="text-xs text-muted-foreground pt-1">
                        Upload %{uploadProgress}
                    </div>
                </div>
            )}

        </div>
    );
}