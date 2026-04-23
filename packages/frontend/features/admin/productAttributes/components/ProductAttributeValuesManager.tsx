"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Pencil, Check, X, UploadCloud, Loader2 } from "lucide-react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminApiClient } from "@/lib/http/client"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Value = {
    id: string
    name: string
    parentValueId?: string | null
    parentValue?: {
        id: string
        name: string
    } | null
    assets?: {
        id: string
        key: string
        mimeType: string
        type: string
        role: string
        url: string
    }[]
}

type AttributeWithValues = {
    id: string
    code: string
    name: string
    values: Value[]
}

type Props = {
    attributeId: string
    attributeCode: string
}

const ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

function getParentAttributeCode(attributeCode: string): string | null {
    if (attributeCode === ATTRIBUTE_CODES.productionGroup) return ATTRIBUTE_CODES.sector
    if (attributeCode === ATTRIBUTE_CODES.usageArea) return ATTRIBUTE_CODES.productionGroup
    return null
}

export function ProductAttributeValuesManager({ attributeId, attributeCode }: Props) {

    const queryClient = useQueryClient()

    const [newValue, setNewValue] = useState("")
    const [parentValueId, setParentValueId] = useState<string>("")
    const [editingValueId, setEditingValueId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")
    const [editingParentValueId, setEditingParentValueId] = useState<string>("")
    const [selectedSectorValueId, setSelectedSectorValueId] = useState<string | null>(null)
    const [uploadingValueId, setUploadingValueId] = useState<string | null>(null)
    const parentAttributeCode = getParentAttributeCode(attributeCode)

    // 🔥 LIST
    const { data, isLoading } = useQuery({
        queryKey: ["attribute-values", attributeId],
        queryFn: async () => {
            const res = await adminApiClient.get(`/product-attribute-values/${attributeId}`)
            return res.data.payload.data as Value[]
        }
    })

    const { data: attributesForFilter } = useQuery({
        queryKey: ["product-attributes-filter"],
        queryFn: async () => {
            const res = await adminApiClient.get("/product-attributes/with-values")
            return res.data.payload.data as AttributeWithValues[]
        }
    })

    const parentValues =
        parentAttributeCode
            ? (attributesForFilter?.find((attr) => attr.code === parentAttributeCode)?.values ?? [])
            : []

    const productionGroupValues = useMemo(
        () => attributesForFilter?.find((attr) => attr.code === ATTRIBUTE_CODES.productionGroup)?.values ?? [],
        [attributesForFilter]
    )

    const linkedProductionGroups = useMemo(() => {
        if (attributeCode !== ATTRIBUTE_CODES.sector || !selectedSectorValueId) return []
        return productionGroupValues.filter((value) => value.parentValueId === selectedSectorValueId)
    }, [attributeCode, productionGroupValues, selectedSectorValueId])

    // 🔥 CREATE
    const createMutation = useMutation({
        mutationFn: async () => {
            await adminApiClient.post("/product-attribute-values", {
                name: newValue,
                attributeId,
                ...(parentAttributeCode && { parentValueId }),
            })
        },
        onSuccess() {
            setNewValue("")
            setParentValueId("")
            queryClient.invalidateQueries({
                queryKey: ["attribute-values", attributeId]
            })
            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"] // 🔥 CRITICAL
            })
        }
    })

    // 🔥 DELETE
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await adminApiClient.delete(`/product-attribute-values/${id}`)
        },
        onSuccess() {
            queryClient.invalidateQueries({
                queryKey: ["attribute-values", attributeId]
            })
            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"]
            })
        }
    })

    const updateMutation = useMutation({
        mutationFn: async ({
            id,
            name,
            parentId,
        }: {
            id: string
            name: string
            parentId?: string
        }) => {
            await adminApiClient.put(`/product-attribute-values/${id}`, {
                name,
                ...(parentAttributeCode && { parentValueId: parentId }),
            })
        },
        onSuccess() {
            setEditingValueId(null)
            setEditingName("")
            setEditingParentValueId("")
            queryClient.invalidateQueries({
                queryKey: ["attribute-values", attributeId]
            })
            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"]
            })
        }
    })

    const uploadAssetMutation = useMutation({
        mutationFn: async ({ valueId, file }: { valueId: string, file: File }) => {
            const value = data?.find((item) => item.id === valueId)
            const existingAssets = value?.assets ?? []

            if (existingAssets.length > 0) {
                await Promise.all(existingAssets.map((asset) => adminApiClient.delete(`/assets/${asset.id}`)))
            }

            const presignRes = await adminApiClient.post("/product-attribute-values/assets/presign", {
                productAttributeValueId: valueId,
                assetRole: "PRIMARY",
                fileName: file.name,
                contentType: file.type || "image/jpeg",
            })

            const { uploadUrl, key } = presignRes.data.payload

            await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type || "image/jpeg" },
                body: file,
            })

            await adminApiClient.put(`/product-attribute-values/${valueId}`, {
                assetType: "IMAGE",
                assetRole: "PRIMARY",
                assetKey: key,
                mimeType: file.type || "image/jpeg",
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attribute-values", attributeId]
            })
            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"]
            })
        },
        onSettled: () => {
            setUploadingValueId(null)
        }
    })

    const deleteAssetMutation = useMutation({
        mutationFn: async (assetId: string) => {
            await adminApiClient.delete(`/assets/${assetId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attribute-values", attributeId]
            })
            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"]
            })
        }
    })

    const handleSelectAssetFile = (valueId: string, file?: File | null) => {
        if (!file) return
        setUploadingValueId(valueId)
        uploadAssetMutation.mutate({ valueId, file })
    }

    function handleCreate() {
        if (!newValue.trim()) return
        if (parentAttributeCode && !parentValueId) return
        createMutation.mutate()
    }

    function startEdit(value: Value) {
        setEditingValueId(value.id)
        setEditingName(value.name)
        setEditingParentValueId(value.parentValueId ?? "")
    }

    function cancelEdit() {
        setEditingValueId(null)
        setEditingName("")
        setEditingParentValueId("")
    }

    function saveEdit(id: string) {
        if (!editingName.trim()) return
        if (parentAttributeCode && !editingParentValueId) return

        updateMutation.mutate({
            id,
            name: editingName.trim(),
            ...(parentAttributeCode && { parentId: editingParentValueId }),
        })
    }

    if (isLoading) {
        return <p className="text-sm text-neutral-500">Yükleniyor...</p>
    }

    return (
        <div className="space-y-4">

            {/* HEADER */}
            <div className="flex gap-2">
                <Input
                    placeholder="Yeni değer ekle..."
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                />
                {parentAttributeCode && (
                    <Select value={parentValueId} onValueChange={setParentValueId}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder={`${parentAttributeCode} seç`} />
                        </SelectTrigger>
                        <SelectContent>
                            {parentValues.map((value) => (
                                <SelectItem key={value.id} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || (Boolean(parentAttributeCode) && !parentValueId)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* LIST */}
            <div className="space-y-2">

                {data?.map(val => (

                    <div
                        key={val.id}
                        className={[
                            "border rounded-lg px-3 py-2",
                            attributeCode === ATTRIBUTE_CODES.sector && selectedSectorValueId === val.id
                                ? "border-amber-400 bg-amber-50/40"
                                : ""
                        ].join(" ")}
                    >
                        {editingValueId === val.id ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        placeholder="Değer adı"
                                    />
                                    {parentAttributeCode && (
                                        <Select value={editingParentValueId} onValueChange={setEditingParentValueId}>
                                            <SelectTrigger className="w-[220px]">
                                                <SelectValue placeholder={`${parentAttributeCode} seç`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parentValues.map((value) => (
                                                    <SelectItem key={value.id} value={value.id}>
                                                        {value.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => saveEdit(val.id)}
                                        disabled={
                                            updateMutation.isPending ||
                                            !editingName.trim() ||
                                            (Boolean(parentAttributeCode) && !editingParentValueId)
                                        }
                                    >
                                        <Check className="w-4 h-4 mr-1" />
                                        Kaydet
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                                        <X className="w-4 h-4 mr-1" />
                                        Vazgeç
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-sm">{val.name}</span>
                                    {val.parentValue?.name && (
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            Bağlı: {val.parentValue.name}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="relative h-14 w-20 overflow-hidden rounded-md border bg-neutral-100">
                                            {val.assets?.[0]?.url ? (
                                                <Image
                                                    src={val.assets[0].url}
                                                    alt={`${val.name} görseli`}
                                                    fill
                                                    loading="lazy"
                                                    sizes="80px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                                                    Görsel yok
                                                </div>
                                            )}
                                        </div>

                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => handleSelectAssetFile(val.id, event.target.files?.[0])}
                                            />
                                            <span className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs hover:bg-neutral-50">
                                                {uploadingValueId === val.id && uploadAssetMutation.isPending ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <UploadCloud className="h-3.5 w-3.5" />
                                                )}
                                                Görsel Yükle
                                            </span>
                                        </label>

                                        {val.assets?.[0]?.id && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2 text-xs"
                                                onClick={() => deleteAssetMutation.mutate(val.assets![0].id)}
                                                disabled={deleteAssetMutation.isPending}
                                            >
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                Sil
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {attributeCode === ATTRIBUTE_CODES.sector && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setSelectedSectorValueId((current) =>
                                                    current === val.id ? null : val.id
                                                )
                                            }
                                        >
                                            Bağlı Gruplar
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => startEdit(val)}
                                    >
                                        <Pencil className="w-4 h-4 text-neutral-600" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => deleteMutation.mutate(val.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                ))}

                {!data?.length && (
                    <p className="text-sm text-neutral-400">
                        Henüz değer yok
                    </p>
                )}

            </div>

            {attributeCode === ATTRIBUTE_CODES.sector && selectedSectorValueId && (
                <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Seçilen Sektöre Bağlı Production Group</p>
                    <div className="mt-2 space-y-1">
                        {linkedProductionGroups.length > 0 ? (
                            linkedProductionGroups.map((group) => (
                                <div key={group.id} className="text-sm text-neutral-700 border rounded px-2 py-1">
                                    {group.name}
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-neutral-500">Bu sektöre bağlı production_group bulunamadı.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
