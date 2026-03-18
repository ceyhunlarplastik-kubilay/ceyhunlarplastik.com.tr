"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminApiClient } from "@/lib/http/client"

type Value = {
    id: string
    name: string
}

type Props = {
    attributeId: string
}

export function ProductAttributeValuesManager({ attributeId }: Props) {

    const queryClient = useQueryClient()

    const [newValue, setNewValue] = useState("")

    // 🔥 LIST
    const { data, isLoading } = useQuery({
        queryKey: ["attribute-values", attributeId],
        queryFn: async () => {
            const res = await adminApiClient.get(`/product-attribute-values/${attributeId}`)
            return res.data.payload.data as Value[]
        }
    })

    // 🔥 CREATE
    const createMutation = useMutation({
        mutationFn: async () => {
            await adminApiClient.post("/product-attribute-values", {
                name: newValue,
                attributeId
            })
        },
        onSuccess() {
            setNewValue("")
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

    function handleCreate() {
        if (!newValue.trim()) return
        createMutation.mutate()
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
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* LIST */}
            <div className="space-y-2">

                {data?.map(val => (

                    <div
                        key={val.id}
                        className="flex items-center justify-between border rounded-lg px-3 py-2"
                    >
                        <span className="text-sm">
                            {val.name}
                        </span>

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(val.id)}
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>

                ))}

                {!data?.length && (
                    <p className="text-sm text-neutral-400">
                        Henüz değer yok
                    </p>
                )}

            </div>
        </div>
    )
}