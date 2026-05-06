"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCategoryFilterRail } from "@/features/admin/products/components/ProductCategoryFilterRail"
import type { Category } from "@/features/public/categories/types"

type Props = {
    categories: Category[]
    search: string
    categoryId: string
    onSearchChange: (value: string) => void
    onCategoryIdChange: (value: string) => void
}

export function ProductsFilters({
    categories,
    search,
    categoryId,
    onSearchChange,
    onCategoryIdChange,
}: Props) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Ürün kodu, adı veya slug ara"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Button variant="ghost" onClick={() => onSearchChange("")}>
                    Aramayı Temizle
                </Button>
            </div>

            <ProductCategoryFilterRail
                categories={categories}
                categoryId={categoryId}
                onCategoryIdChange={onCategoryIdChange}
            />
        </div>
    )
}
