"use client"

import { RotateCcw, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
    const selectedAttribute = attributes.find((attribute) => attribute.code === code)

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Özellik adı veya kodu ara"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 pl-9"
                    />
                </div>

                <Select
                    value={code || "__all__"}
                    onValueChange={(value) => onCodeChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger className="h-11 w-full bg-white">
                        <SelectValue placeholder="Tüm Kodlar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Kodlar</SelectItem>
                        {attributes.map((attribute) => (
                            <SelectItem key={attribute.id} value={attribute.code}>
                                {attribute.name} ({attribute.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2"
                    onClick={() => {
                        onSearchChange("")
                        onCodeChange("")
                    }}
                >
                    <RotateCcw className="h-4 w-4" />
                    Temizle
                </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {selectedAttribute ? (
                    <Badge variant="secondary">
                        {selectedAttribute.name}: {selectedAttribute.code}
                    </Badge>
                ) : (
                    <Badge variant="outline">Tüm özellik kodları</Badge>
                )}
                {search.trim() ? <Badge variant="outline">Arama: {search.trim()}</Badge> : null}
            </div>
        </div>
    )
}
