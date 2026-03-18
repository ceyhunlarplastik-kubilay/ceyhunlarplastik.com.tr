"use client"

import { useState } from "react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useCreateProduct } from "@/features/admin/products/hooks/useCreateProduct"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"

import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onCreated: (product: Product) => void
}

export function CreateProductDialog({
    open,
    onOpenChange,
    categories,
    onCreated
}: Props) {

    const createMutation = useCreateProduct()

    const [name, setName] = useState("")
    const [code, setCode] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [attributeValueIds, setAttributeValueIds] = useState<string[]>([])

    async function handleSubmit() {

        const product = await createMutation.mutateAsync({
            name,
            code,
            categoryId,
            attributeValueIds
        })
        onCreated(product)
        onOpenChange(false)
        setName("")
        setCode("")
        setCategoryId("")
        setAttributeValueIds([])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Ürün</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">

                    <Input
                        placeholder="Ürün adı"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        placeholder="Ürün kodu"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />

                    <select
                        className="border rounded p-2 w-full"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >

                        <option value="">Kategori seç</option>

                        {categories.map(cat => (

                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>

                        ))}
                    </select>

                    <ProductAttributeSelect
                        value={attributeValueIds}
                        onChange={setAttributeValueIds}
                    />

                    <Button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                    >
                        Oluştur
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
