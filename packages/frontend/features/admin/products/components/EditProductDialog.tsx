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

import { useUpdateProduct } from "@/features/admin/products/hooks/useUpdateProduct"

import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"

import { ProductAssetManager } from "@/features/admin/products/components/asset/ProductAssetManager"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"

type Props = {
    product: Product
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onUpdated: (product: Product) => void
}

export function EditProductDialog({

    product,
    open,
    onOpenChange,
    categories,
    onUpdated

}: Props) {

    const updateMutation = useUpdateProduct()

    const [name, setName] = useState(product.name)
    const [code, setCode] = useState(product.code)
    const [categoryId, setCategoryId] = useState(product.categoryId)
    const [attributeValueIds, setAttributeValueIds] = useState<string[]>(
        product.attributeValues?.map(v => v.id) ?? []
    )

    async function handleSave() {
        const updated = await updateMutation.mutateAsync({
            id: product.id,
            name,
            code,
            categoryId,
            attributeValueIds
        })
        onUpdated(updated)
    }

    return (

        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Ürün Düzenle</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-4 space-y-4">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <ProductAttributeSelect
                            value={attributeValueIds}
                            onChange={setAttributeValueIds}
                        />
                        <Button onClick={handleSave}>
                            Kaydet
                        </Button>
                    </div>
                    <div className="col-span-8">
                        <ProductAssetManager
                            product={product}
                            refetchProduct={async () => location.reload()}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
