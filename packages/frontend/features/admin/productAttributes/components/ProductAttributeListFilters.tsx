"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"

type Props = {
    attributes: ProductAttribute[]
    search: string
    code: string
    onSearchChange: (value: string) => void
    onCodeChange: (value: string) => void
}

export function ProductAttributeListFilters({
    attributes,
    search,
    code,
    onSearchChange,
    onCodeChange,
}: Props) {
    return (
        <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                    placeholder="Attribute adı veya kodu ara"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="flex gap-2">
                <Select
                    value={code || "__all__"}
                    onValueChange={(value) => onCodeChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tüm Kodlar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Kodlar</SelectItem>
                        {attributes.map((attribute) => (
                            <SelectItem key={attribute.id} value={attribute.code}>
                                {attribute.code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button variant="ghost" onClick={() => onSearchChange("")}>
                    Temizle
                </Button>
            </div>
        </div>
    )
}
